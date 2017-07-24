const { promisify } = require('util');
const shiroTrie = require('shiro-trie');
const { Schema } = require('mongoose');
const { pbkdf2, randomBytes, timingSafeEqual } = require('crypto');
const { sign, verify } = require('jsonwebtoken');

const signAsync = promisify(sign);

const { values } = require('lodash')
const { orgPermissions, orgStatus, SECRET, SECRET_PUBLIC } = require('../config');

const SubOrganisationSchema = new Schema({
  title: String, // org title
  logo: String, // org logoUrl
  role: {
    type: String,
    enum: values(orgStatus),
    index: true
  }, // status
  ack: Boolean,
  ref: { type: Schema.Types.ObjectId, unique: true}, // organisation id
  t: Date,
});

SubOrganisationSchema.pre('save', function(next) {
    if (this.isInit()) this.t = new Date();
    return next();
});

// const SubEventSchema = new Schema({
//   title: String,
//   startTime: Date,
//   endTime: {
//     type: Date,
//     expires: 0
//   },
//   status: { type: String, index: true }, // status
//   org: Schema.Types.ObjectId,
//   _id: { type: Schema.Types.ObjectId, unique: true} // event id
// });
// SubEventSchema.index({ endTime: 1}, { expireAfterSeconds: 0 }) // Expire after 12h

const UserSchema = new Schema({
  firstname:  String,
  lastname: String,
  password: String,
  salt: String,
  email: {
    type: String,
    index: true,
  },
  confirmed: Boolean,
  avatar:   String,
  birthday: Date,
  birthplace: String,
  phone1: String,
  phone2: String,
  facebookId: {
    type: String,
    index: true,
    sparse: true,
  },
  organisations: [SubOrganisationSchema],
}, {
  timestamps: true
});

UserSchema.virtual('fullname')
  .get(function() { return this.firstname + ' ' + this.lastname; })
  .set(function(v) {
    this.firstname = v.substr(0, v.indexOf(' '));
    this.lastname = v.substr(v.indexOf(' ') + 1);
  });

UserSchema.virtual('permissions')
  .get(function() {
    const permissions = shiroTrie.new();

    if (this.organisations) {
      permissions.add(this.organisations.reduce((p, o) => {
        if (!o.role || !o.ref) return p;
        return p.concat(orgPermissions[o.role].map(a => `organisation:${o.ref}:${a}`));
      }, []));
    }

    return permissions;
  });

const hashPassword = (password, salt) => new Promise((resolve, reject) => {
  pbkdf2(password, salt, 100000, 512, 'sha512', (err, buf) => {
    if (err) reject(err);
    resolve(buf);
  });
});

const generateSalt = () => new Promise((resolve, reject) => {
  randomBytes(128, (err, buf) => {
    if (err) reject(err);
    resolve(buf);
  });
});

UserSchema.pre('save', function(next) {
    // only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    generateSalt()
      .then(salt => {
        this.salt = salt.toString('hex');
        return hashPassword(this.password, salt)
      })
      .then(buff => {
        this.password = buff.toString('hex')
        next();
      })
      .catch(err => {
        next(err);
      });
});

UserSchema.methods.comparePassword = function(candidatePassword) {
  if (!this.salt || !this.password) return Promise.reject(false);
  return hashPassword(candidatePassword, Buffer.from(this.salt, 'hex')).then(buff => {
    return new Promise((resolve, reject) => {
      timingSafeEqual(buff, Buffer.from(this.password, 'hex')) ? resolve(true) : reject(false);
    })
  });
};

UserSchema.methods.getToken = function() {
  return signAsync({
    email: this.email,
    id: this._id,
  }, SECRET, { algorithm: 'HS512'})
};

UserSchema.methods.getPublicToken = function(options) {
  return signAsync(this._id, SECRET_PUBLIC, options)
};

UserSchema.statics.findByToken = function(token) {
  return new Promise((resolve, reject) => {
    if (!token) return reject(null);
    try {
      return resolve(verify(token, SECRET, { algorithms: ['HS512'] }));
    } catch (e) {
      return reject(e)
    }
  }).then(payload => {
    return this.findById(payload.id)
  }).catch(e => {
    console.log(e);
    return null;
  })
}

UserSchema.statics.findByPublicToken = function(token) {
  return new Promise((resolve, reject) => {
    if (!token) return reject(null);
    try {
      return resolve(verify(token, SECRET_PUBLIC));
    } catch (e) {
      return reject(e)
    }
  }).then(userId => {
    return this.findById(userId)
  }).catch(e => {
    console.log(e);
    return null;
  });
}
UserSchema.statics.confirmByPublicToken = function(token) {
  return new Promise((resolve, reject) => {
    if (!token) return reject(null);
    try {
      return resolve(verify(token, SECRET_PUBLIC));
    } catch (e) {
      return reject(e)
    }
  }).then(userId => {
    return this.findByIdAndUpdate(userId, {
      $set: { confirmed: 'true' }
    }, { new: false })
  })
  .catch(e => {
    console.log(e);
    return null;
  });
}

module.exports = UserSchema;
