'use babel';

const assert = require('assert');

const global_variable = 'i am global';

describe('mocha runner', () => {
  const describe_variable = 'i am in describe';

  before('Before all hook', (done) => {
    console.info('before all');
        // throw new Error('whatever');
    done();
  });

  it('should start log', (done) => {
    console.info('Hello');
    done();
  });

  it('should throw', () => {
    console.error(new Error('test#1'));
    console.log('sgsdglknsldgnslkdgnlasgndl;asdgnlasdgnasldg0');
  });

  it('should return console log text and shows strings diff', () => {
    console.info('test#string');
    assert.equal('stringA', 'stringB');
  });

  it('should return console log text and shows date diff', () => {
    console.info('test#date');
    assert.equal(new Date(), new Date('01-01-2016'));
  });

  it('should return console log text and shows array diff', () => {
    console.info('test#array');
    assert.equal(['1', '2'], ['3', '2']);
  });

  it('should compare two objects', () => {
    console.info('test#object');
    const foo = {
      largestCities: [
        'São Paulo',
        'Buenos Aires',
        'Rio de Janeiro',
        'Lima',
        'Bogotá',
      ],
      languages: [
        'spanish',
        'portuguese',
        'english',
        'dutch',
        'french',
        'quechua',
        'guaraní',
        'aimara',
        'mapudungun',
      ],
    };
    const bar = {
      largestCities: [
        'São Paulo',
        'Buenos Aires',
        'Rio de Janeiro',
        'Lima',
        'Bogotá',
      ],
      languages: [
        'spanish',
        'portuguese',
        'inglés',
        'dutch',
        'french',
        'quechua',
        'guaraní',
        'aimara',
        'mapudungun',
      ],
    };
    assert.deepEqual(foo, bar);
  });

  it('should compare true and false', () => {
    const foo = 5;
    assert.equal(true, false);
  });

  describe('Handle console output deeper', () => {
    it('should delay test and pass', (done) => {
      console.info('test with delay');
      assert.ok(true, true);
      setTimeout(done, 5000);
    });
  });


  describe('Handle console output1', () => {
    it('should return console log text', () => {
      console.info('test pass');
    });
  });

  describe('Skip this', () => {
    it.skip('should skip test', () => {
      console.info('test skiped');
    });
  });
  after('after this describe hook', () => {
    console.info('after hook');
  });
});
