exports.corruptIdOfMongooseObject = (mongooseObj) => {
  /*
  Create a valid Mongoose ID
  which, however, does not exist in a Mongoose model.
  */

  const objId = mongooseObj._id.toString();

  const notLastDigitOfId = objId.charAt(objId.length - 1) == '0' ? '1' : '0';
  const nonexistentId = objId.slice(0, objId.length - 1) + notLastDigitOfId;

  return nonexistentId;
};

exports.decodeQueryStringWithinUrl = (url) => {
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

const MAX_PER_PAGE = 100;

exports.determinePaginationInfoInitial = (
  reqQueryPerPage,
  reqQueryPage,
  total
) => {
  if (typeof total !== 'number' || total <= 0) {
    throw Error('"total" must be a strictly positive integer');
  }

  let perPage = parseInt(reqQueryPerPage) || MAX_PER_PAGE;
  perPage = Math.min(perPage, MAX_PER_PAGE);

  const pageLast = Math.ceil(total / perPage);

  let page = parseInt(reqQueryPage) || 1;
  page = page < 1 ? 1 : page;
  page = page > pageLast ? pageLast : page;

  const pagePrev = page == 1 ? null : page - 1;
  const pageNext = page == pageLast ? null : page + 1;

  return {
    perPage,
    pageFirst: 1,
    pagePrev,
    pageCurr: page,
    pageNext,
    pageLast,
  };
};
