const shiroTrie = require('shiro-trie');
const { Schema } = require('mongoose');
const { pbkdf2, randomBytes, timingSafeEqual } = require('crypto');
const { sign, verify } = require('jsonwebtoken');

const { values } = require('lodash')
const config = require('../config');
const { orgPermissions, orgStatus } = require('../dict');
const pubsub = require('../utils/pubsub');

const signAsync = (data, secret, options) => {
  return new Promise((resolve, reject) => {
    sign(data, secret, options, (err, res) => {
      if (err) return reject(err);
      return resolve(res);
    })
  })
};

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



const SubOrganisationSchema = new Schema({
  title: { type: String, required: true },
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
    unique: true,
  },
  organisations: {
    type: [SubOrganisationSchema],
    default: [],
  },
  norganisations: { type: Number, default: 0 },
}, {
  timestamps: true
});

UserSchema.virtual('fullname')
  .get(function() {
    if (!this.firstname && !this.lastname) return this.email;
    return `${this.firstname ? this.firstname : ''} ${this.lastname ? this.lastname : ''}`;
  })
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

UserSchema.pre('save', function(next) {
    // only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    generateSalt()
      .then(salt => {
        this.salt = salt.toString('hex');
        return hashPassword(this.password, salt)
      })
      .then(buffer => {
        this.password = buffer.toString('hex')
        next();
      })
      .catch(err => {
        next(err);
      });
});

UserSchema.methods.comparePassword = function(candidatePassword) {
  return Promise.resolve()
  .then(() => {
    if (!this.salt) {
      throw new Error(`No salt defined for user ${this._id}`)
    }
    if (!this.password) {
      throw new Error(`No password defined for user ${this._id}`)
    }
    return hashPassword(candidatePassword, Buffer.from(this.salt, 'hex'))
  })
  .then(buffer => {
    return new Promise((resolve, reject) => {
      timingSafeEqual(buffer, Buffer.from(this.password, 'hex')) ? resolve(true) : reject(false);
    })
  })

};

UserSchema.methods.getToken = function() {
  return signAsync({
    id: this._id,
  }, config.get('SECRET'))
};

UserSchema.methods.sendConfirmation = function() {
  return Promise.resolve()
    .then(() => {
      return JSON.stringify({
        token: {
          id: this._id
        },
        user: {
          fullname: this.fullname,
          email: this.email,
        },
        subject: 'confirm',
      })
    })
    .then(data => {
      if (config.get('PUBSUB_TOPIC_EMAIL')) {
        return pubsub.publishMessage(config.get('PUBSUB_TOPIC_EMAIL'), Buffer.from(data));
      }
      console.log('No pubsub topic defined to send confirmation email. message not send')
      return;
    })
    .catch(e => {
      console.log(e)
    })
}

UserSchema.statics.findByToken = function(token) {
  return new Promise((res, rej) => {
    if (!token) return rej('You must provide a valid token');
    verify(token, config.get('SECRET'), (err, payload) => {
      if(err) rej(err);
      res(payload)
    })
  })
  .then(payload => {
    return this.findById(payload.id);
  })
}

UserSchema.statics.findByToken = function(token, toptions, options) {
  return new Promise((res, rej) => {
    if (!token) return rej('You must provide a valid token');
    verify(token, config.get('SECRET'), toptions, (err, payload) => {
      if(err) rej(err);
      res(payload)
    })
  })
  .then(payload => {
    return this.findById(payload.id, options);
  })
}

module.exports = UserSchema;
