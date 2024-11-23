class VCWD {
    static sanityCheck(input) {
        return input + 1;
    }
}

if (typeof window !== 'undefined') {
    window.VCWD = VCWD;
}

export default VCWD;