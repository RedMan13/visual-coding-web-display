import VCWD from '../src/index';

test('sanity check', () => {
    expect(VCWD.sanityCheck(1)).toBe(2);
});