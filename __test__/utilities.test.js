const {
  decodeQueryStringWithinUrl,
  determinePaginationInfo,
} = require('../src/utilities');

describe('decodeQueryStringWithinUrl', () => {
  test('if no query parameters, should return the same URL', () => {
    // Arrange.
    const url = 'localhost:5000/api/v1/issues';

    // Act.
    const urlWithQueryStringDecoded = decodeQueryStringWithinUrl(url);

    // Assert.
    expect(urlWithQueryStringDecoded).toEqual('localhost:5000/api/v1/issues');
  });

  test('if query parameters, should replace each "," with "%2C"', () => {
    // Arrange.
    const url =
      'localhost:5000?parameter_1=value_1_1,value_2_1&parameter_2=value_2_1';

    // Act.
    const urlWithQueryStringDecoded = decodeQueryStringWithinUrl(url);

    // Assert.
    expect(urlWithQueryStringDecoded).toEqual(
      'localhost:5000?parameter_1=value_1_1%2Cvalue_2_1&parameter_2=value_2_1'
    );
  });
});

describe('determinePaginationInfo', () => {
  // TODO: (2024/09/01, 11:16)
  //      refine the implementation for the case `total === 0` + update this test accordingly
  test('if "total" is 0, should ...', () => {
    // Arrage.
    const reqQueryPerPage = '10';
    const reqQueryPage = '1';
    const total = 0;

    // Act.
    const paginationInfo = determinePaginationInfo(
      reqQueryPerPage,
      reqQueryPage,
      total
    );

    // Assert.
    expect(paginationInfo).toEqual({
      perPage: 10,
      pageFirst: 1,
      pagePrev: -1,
      pageCurr: 0,
      pageNext: null,
      pageLast: 0,
    });
  });

  test('the happy path when "reqQueryPage" equals a number', () => {
    // Arrange.
    const reqQueryPerPage = '10';
    const reqQueryPage = '5';
    const total = 103;

    // Act.
    const paginationInfo = determinePaginationInfo(
      reqQueryPerPage,
      reqQueryPage,
      total
    );

    // Assert.
    expect(paginationInfo).toEqual({
      perPage: 10,
      pageFirst: 1,
      pagePrev: 4,
      pageCurr: 5,
      pageNext: 6,
      pageLast: 11,
    });
  });

  test('the happy path when "reqQueryPage" equals `undefined`', () => {
    // Arrange.
    const reqQueryPerPage = '10';
    const reqQueryPage = undefined;
    const total = 103;

    // Act.
    const paginationInfo = determinePaginationInfo(
      reqQueryPerPage,
      reqQueryPage,
      total
    );

    // Assert.
    expect(paginationInfo).toEqual({
      perPage: 10,
      pageFirst: 1,
      pagePrev: null,
      pageCurr: 1,
      pageNext: 2,
      pageLast: 11,
    });
  });
});
