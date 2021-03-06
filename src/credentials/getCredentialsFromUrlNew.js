// Parses a new url type:
//
// otp-url#73bf73bf73bf73bf&PdJqRTPgxTFXkK8GseP6&&6BzcwMaqTGGsSVTgFx9F&
//
// s=104.192.192.192 <or> 73bf73bf73bf73bf.dyndns.dappnode.io
// x=PdjqPdjqPdjqPdjqPdjq
// u=my-device <or> ""
// p=6Bzc6Bzc6Bzc6Bzc6Bzc
// n=myDAppnode <or> ""

function isHex(str) {
  const regexp = new RegExp("^[0-9a-fA-F]+$");
  return Boolean(regexp.test(str));
}

const encode = {
  // To optimize the server address, if a hex string is passed
  // it is assumed to be the subdomain of the default dyndns provider
  server: input => input.split(".dyndns.dappnode.io")[0],
  psk: input => input,
  // If no user is provided, assume it is the default admin user
  user: input => (input === "dappnode_admin" ? "" : input),
  pass: input => input,
  name: input => input
};

const decode = {
  // To optimize the server address, if a hex string is passed
  // it is assumed to be the subdomain of the default dyndns provider
  server: input => {
    if (input.startsWith("otp=")) {
      console.error(
        'WARNING! wrongly encoded url, the new format should not be prepended by "otp="'
      );
      input = input.split("otp=")[1];
    }
    if (isHex(input)) return `${input}.dyndns.dappnode.io`;
    else return decodeURIComponent(input);
  },
  psk: decodeURIComponent,
  // If no user is provided, assume it is the default admin user
  user: input => {
    if (!input) return "dappnode_admin";
    else return decodeURIComponent(input);
  },
  pass: decodeURIComponent,
  name: input => {
    if (!input) return "DAppNode VPN";
    input = decodeURIComponent(input);
    const inputLc = input.toLowerCase();
    if (!inputLc.includes("dappnode") && !inputLc.includes("vpn"))
      return `${input} DAppNode VPN`;
    if (!inputLc.includes("dappnode") && inputLc.includes("vpn"))
      return `${input} DAppNode`;
    if (inputLc.includes("dappnode") && !inputLc.includes("vpn"))
      return `${input} VPN`;
    return input;
  }
};

export default function() {
  const pos = window.location.href.indexOf("#");
  if (pos === -1) throw Error("No # present in url");
  const query = window.location.href.substr(pos + 1);

  if (!query.includes("&")) throw Error("hash must include at least one #");

  const params = query.split("&");

  if (params.length !== 5)
    throw Error("The hash query must contain exactly 5 parameters");

  const credentials = {
    server: decode.server(params[0]),
    psk: decode.psk(params[1]),
    user: decode.user(params[2]),
    pass: decode.pass(params[3]),
    name: decode.name(params[4])
  };

  // Append extra credentials
  // the otp is only used in the apple profile to signal uniqueness
  // It should generate some random data that's the same for equal profiles
  credentials.otp = encodeURIComponent(
    [credentials.psk, credentials.pass].join("")
  );

  // Return the valid credentials object
  return credentials;
}

window.generateSampleOTPNew = (_credentials = {}) => {
  const credentials = {
    server: _credentials.server || "73bf73bf73bf73bf",
    psk: _credentials.psk || "PdjqPdjqPdjqPdjqPdjq",
    user: _credentials.user || "",
    pass: _credentials.pass || "6Bzc6Bzc6Bzc6Bzc6Bzc",
    name: "name" in _credentials ? _credentials.name : "myDAppnode"
  };
  const otpEncoded = [
    encode.server(credentials.server),
    encode.psk(credentials.psk),
    encode.user(credentials.user),
    encode.pass(credentials.pass),
    encode.name(credentials.name)
  ]
    .map(encodeURIComponent)
    .join("&");
  const url = `${window.location.origin}${
    process.env.PUBLIC_URL
  }#${otpEncoded}`;
  window.location.replace(url);
  window.location.reload();
};
