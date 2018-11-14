'use strict';

const _ = require('lodash');
const config = require('config');
const crypto = require('crypto');
const pem = require('pem');
const URL = require('url');
const queryString = require('query-string');
const Saml = require('passport-saml/lib/passport-saml/saml');

const createKey = (cb) => {
  const buf = crypto.randomBytes(16);
  return _.isFunction(cb) ? cb(null, buf) : buf;
};

function genSelfSignedCertificate (privateKey, days, cb) {
  const opt = config.has('saml.csr') ? _.clone(config.get('saml.csr')) : {};
  opt.selfSigned = true;
  if (_.isString(privateKey) && privateKey) {
    opt.clientKey = privateKey;
  }
  opt.days = _.isInteger(days) && days > 0 ? days : 360;
  pem.createCertificate(opt, (err, res) => {
    if (err) return cb(err);
    return cb(null, {
      publicCert: res.certificate,
      csr: res.csr,
      privateKey: res.clientKey,
    });
  });
}

function getSamlAuthorizeUrl(keyPairs, cb) {
  const opt = {
    callbackUrl: config.get('saml.acsUrl'),
    entryPoint: 'https://some.idp.com/sso',
    logoutUrl: 'https://some.idp.com/slo',
    cert: createKey(),
    issuer: 'some.idp.com',
    privateCert: keyPairs.privateKey,
    signatureAlgorithm: 'sha256',
  };
  const samlInstance = new Saml.SAML(opt);
  samlInstance.getAuthorizeUrl({}, (err, authUrl) => {
    if (err) return cb(err);
    return cb(null, authUrl);
  });
}

function main() {
  genSelfSignedCertificate(null, null, (err1, keyPairs) => {
    if (err1) return console.error(err1);
    return getSamlAuthorizeUrl(keyPairs, (err2, res2) => {
      if (err2) return console.error(err2);
      const url = URL.parse(res2);
      const parsedUrlObj = queryString.parse(url.search);
      return console.log(parsedUrlObj);
    });
  });
}

main();
