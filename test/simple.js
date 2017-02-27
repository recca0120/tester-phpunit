
var assert = require('assert');
var global_variable = 'i am global';

describe('mocha runner', function () {
    this.timeout(0);
    var describe_variable = 'i am in describe';

    before('Before all hook', function (done) {
        console.info('before all');
        //throw new Error('whatever');
        done();
    });

    it('should start log', function (done) {
        console.info('Hello');
        done();
    });

    it('should throw', function () {
        console.error(new Error('test#1'));
        console.log('sgsdglknsldgnslkdgnlasgndl;asdgnlasdgnasldg0');
    });

    it('should return console log text and shows strings diff', function () {
        console.info('test#string');
        assert.equal('stringA', 'stringB');
    });

    it('should return console log text and shows date diff', function () {
        console.info('test#date');
        assert.equal(new Date(), new Date('01-01-2016'));
    });

    it('should return console log text and shows array diff', function () {
        console.info('test#array');
        assert.equal(['1', '2'], ['3', '2']);
    });

    it('should compare two objects', function () {
        console.info('test#object');
        var foo = {
            'largestCities': [
                'São Paulo',
                'Buenos Aires',
                'Rio de Janeiro',
                'Lima',
                'Bogotá'
            ],
            'languages': [
                'spanish',
                'portuguese',
                'english',
                'dutch',
                'french',
                'quechua',
                'guaraní',
                'aimara',
                'mapudungun'
            ]
        };
        var bar = {
            'largestCities': [
                'São Paulo',
                'Buenos Aires',
                'Rio de Janeiro',
                'Lima',
                'Bogotá'
            ],
            'languages': [
                'spanish',
                'portuguese',
                'inglés',
                'dutch',
                'french',
                'quechua',
                'guaraní',
                'aimara',
                'mapudungun'
            ]
        };
        assert.deepEqual(foo, bar);
    });

    it('should compare true and false', function () {
        var foo = 5;
        assert.equal(true, false);
    });

    describe('Handle console output deeper', function () {
        it('should delay test and pass', function (done) {
            console.info('test with delay');
            assert.ok(true);
            setTimeout(done, 1000);
        });
    });



    describe('Handle console output1', function () {
        it('should return console log text', function () {
            console.info('test pass');
        });
    });

    describe('Skip this', function () {
        it.skip('should skip test', function () {
            console.info('test skiped');
        });
    });
    after('after this describe hook', function () {
        console.info('after hook');
    });
});
