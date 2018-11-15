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

function genSelfSignedCertificate(privateKey, days, cb) {
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
  const req = {
    query: {
      RelayState: config.get('saml.relayState'),
    },
  };
  samlInstance.getAuthorizeUrl(req, (err, authUrl) => {
    if (err) return cb(err);
    return cb(null, authUrl);
  });
}

/**
 * Method to verify SAML Signature
 * @param {string} samlRequestUrl - The SAML request URL from SP to IDP
 * @param {string} publicCert - The public certificate for verify signature
 * @param {function} cb - callback function
 */
function verifySignature(samlRequestUrl, publicCert, cb) {
  const url = URL.parse(samlRequestUrl);
  // Parsed url object
  const parsedUrl = queryString.parse(url.search);
  if (!parsedUrl.Signature || !parsedUrl.SigAlg) {
    return cb(new Error('No signature to verify'));
  }
  // The signature to be verified
  const signature = parsedUrl.Signature;
  // Extracts the signature algorithm
  let alg = parsedUrl.SigAlg.match(/sha\d+$/i);
  if (!alg || !alg[0]) {
    return cb(new Error('Unrecognized algorithm'));
  }
  alg = alg[0].toUpperCase();
  // The signed data.
  // Reference: page 17, https://docs.oasis-open.org/security/saml/v2.0/saml-bindings-2.0-os.pdf
  // "  To construct the signature, a string consisting of the concatenation of the RelayState (if present),
  //    SigAlg, and SAMLRequest (or SAMLResponse) query string parameters (each one URLencoded)
  //    is constructed in one of the following ways (ordered as below):
  //        SAMLRequest=value&RelayState=value&SigAlg=value
  //        SAMLResponse=value&RelayState=value&SigAlg=value "
  const signedData = `SAMLRequest=${encodeURIComponent(parsedUrl.SAMLRequest)}`
                     + `&RelayState=${encodeURIComponent(parsedUrl.RelayState)}`
                     + `&SigAlg=${encodeURIComponent(parsedUrl.SigAlg)}`;
  // Verify the signature
  const verifier = crypto.createVerify(alg);
  verifier.update(signedData);
  return cb(null, verifier.verify(publicCert, signature, 'base64'));
}

function main() {
  genSelfSignedCertificate(null, null, (err1, keyPairs) => {
    if (err1) return console.error(err1);
    return getSamlAuthorizeUrl(keyPairs, (err2, res2) => {
      if (err2) return console.error(err2);
      return verifySignature(res2, keyPairs.publicCert, (err3, res3) => {
        if (err3) return console.error(err3);
        return res3 ? console.log('Verified') : console.error('Failed to verify');
      });
    });
  });
}

main();
