export default function toLocalTimeZone(date: Date) {
    return new Date(date.setMinutes(
        date.getMinutes() - (new Date().getTimezoneOffset())
    ))
}