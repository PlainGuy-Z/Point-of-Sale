export function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
export function isOtpExpired(expiresAt) {
    return new Date() > expiresAt;
}
export function getOtpExpiry() {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 3);
    return expiresAt;
}
export function canResendOtp(sentAt) {
    if (sentAt === null) {
        return true;
    }
    const diff = (Date.now() - sentAt.getTime()) / 1000;
    return diff >= 60;
}
