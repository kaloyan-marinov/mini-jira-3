// TODO: (2024/08/31, 11:26)
//      create a separate file,
//      which tests this function on its own
//                  (= implements automated tests for this function in isolation)
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

// TODO: (2024/09/01, 10:19)
//      write a test for the case when `total === 0`
exports.determinePaginationInfo = (reqQueryPerPage, reqQueryPage, total) => {
  // console.log('reqQueryPerPage', reqQueryPerPage);
  let perPage = parseInt(reqQueryPerPage) || MAX_PER_PAGE;
  perPage = Math.min(perPage, MAX_PER_PAGE);

  const pageLast = Math.ceil(total / perPage);

  // console.log('reqQueryPage', reqQueryPage);
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
