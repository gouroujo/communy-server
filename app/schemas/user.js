const shiroTrie = require('shiro-trie');
const { Schema } = require('mongoose');
const { pbkdf2, randomBytes, timingSafeEqual } = require('crypto');
const { sign, verify } = require('jsonwebtoken');

const signAsync = (data, secret, options) => {
  return new Promise((resolve, reject) => {
    sign(data, secret, options, (err, res) => {
      if (err) return reject(err);
      return resolve(res);
    })
  })
}

const { values } = require('lodash')
const { orgPermissions, orgStatus, SECRET, SECRET_PUBLIC } = require('../config');

const SubOrganisationSchema = new Schema({
  title: { type: String, required: true },
  logo: String,
  role: {
    type: String,
    enum: values(orgStatus).concat([null]),
    default: null,
  },
  ack: { type: Boolean, default: false },
  confirm: { type: Boolean, default: false },
  _id: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true },
});

const UserSchema = new Schema({
  firstname:  String,
  lastname: String,
  password: {
    type: String,
    select: false
  },
  salt: {
    type: String,
    select: false
  },
  email: {
    type: String,
    index: true,
  },
  confirm: Boolean,
  userCreated: { type: Boolean, default: false },
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
  organisations: {
    type: [SubOrganisationSchema],
    default: [],
  },
  norganisations: { type: Number, default: 0 },
}, {
  timestamps: true
});

UserSchema.index(
  {
    firstname: 'text',
    lastname: 'text',
    email: 'text',
  }, {
    name: 'user search',
    weights: {
      lastname: 3,
      firstname: 1,
      email: 2,
    }
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
        if (!o.role || !o._id) return p;
        return p.concat(orgPermissions[o.role].map(a => `organisation:${o._id}:${a}`));
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

// UserSchema.query.byToken = function(token) {
//   return new Promise((resolve, reject) => {
//     if (!token) return reject(null);
//     try {
//       return resolve(verify(token, SECRET, { algorithms: ['HS512'] }));
//     } catch (e) {
//       return reject(e)
//     }
//   })
//   .then(payload => {
//     console.log(payload)
//     return this.findById(payload.id, cb)
//   })
//   // return this.find({ name: new RegExp(name, 'i') });
// };

UserSchema.statics.findByToken = function(token, cb) {
  if (!token) return cb(null);
  return verify(token, SECRET, { algorithms: ['HS512'] }, (err, payload) => {
    if(err) return cb(err);
    return this.findById(payload.id, cb)
  })
  //
  //
  // return new Promise((resolve, reject) => {
  //   if (!token) return reject(null);
  //   try {
  //     return resolve(verify(token, SECRET, { algorithms: ['HS512'] }));
  //   } catch (e) {
  //     return reject(e)
  //   }
  // })
  // .then(payload => {
  //   console.log(payload)
  //   return this.findById(payload.id, cb)
  // })
  // .catch(cb)
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
  })
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
      $set: { confirm: 'true' }
    }, { new: false })
  })
}

module.exports = UserSchema;
