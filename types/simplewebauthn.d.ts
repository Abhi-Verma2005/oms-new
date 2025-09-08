declare module '@simplewebauthn/browser' {
  export const startRegistration: any
  export const startAuthentication: any
}

declare module '@simplewebauthn/server' {
  export const generateRegistrationOptions: any
  export const verifyRegistrationResponse: any
  export const generateAuthenticationOptions: any
  export const verifyAuthenticationResponse: any
}


