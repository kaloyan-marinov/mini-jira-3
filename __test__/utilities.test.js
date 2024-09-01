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
  test('if "total" is 0, should throw an error', () => {
    // Arrage.
    const reqQueryPerPage = '10';
    const reqQueryPage = '1';
    const total = 0;

    const funcThatWillThrowError = () => {
      return determinePaginationInfo(reqQueryPerPage, reqQueryPage, total);
    };

    // Act. + Assert.
    const expectedError = new Error(
      '"total" must be a strictly positive integer'
    );

    expect(funcThatWillThrowError).toThrowError(expectedError);
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
