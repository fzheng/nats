'use strict';

module.exports = {
  saml: {
    algorithm: 'aes256',
    key: 'ee5QebL2yHy50YojbA/Xqn2oVKquwC8/1lTjw6q1LrvP4P7eNWbbnr4htlZzXHWV7EOkKcpLUY5AnDHMl/RvYw==',
    acsUrl: 'https://software.example.com/saml/login',
    relayState: 'https://software.example.com/landing',
    csr: {
      country: 'US',
      state: 'Massachusetts',
      locality: 'Boston',
      organization: 'Example, Inc.',
      commonName: 'software.example.com',
    },
  },
};
