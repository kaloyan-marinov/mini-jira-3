// TODO: (2024/08/31, 11:26)
//      create a separate file,
//      which tests this function on its own
//                  (= implements automated tests for this function in isolation)
const decodeQueryStringWithinUrl = (url) => {
  const [baseUrl, queryStringRaw] = url.split('?');

  if (!queryStringRaw) {
    return baseUrl;
  }

  const paramsRaw = new URLSearchParams(queryStringRaw);
  const paramsDecoded = new URLSearchParams();
  paramsRaw.forEach((value, key) => {
    paramsDecoded.set(key, decodeURIComponent(value));
  });
  const queryStringDecoded = paramsDecoded.toString();

  return `${baseUrl}?${queryStringDecoded}`;
};

module.exports = decodeQueryStringWithinUrl;
