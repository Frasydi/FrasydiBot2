export default function convertTel(text : string) {
    if (text.endsWith("@s.whatsapp.net") || text.endsWith("@lid")) {
        return text;
    }
    if (text.includes("@lid")) {
        return text.split("@")[0].replace(/\D/g, "") + "@lid";
    }
    // Strip everything except numbers
    let clean = text.replace(/\D/g, "");
    
    // Check if the cleaned number matches LID length/prefix pattern
    if (clean.length === 15 && clean.startsWith("9")) {
        return clean + "@lid";
    }

    if (clean.startsWith("0")) {
        clean = "62" + clean.slice(1);
    }
    return clean + "@s.whatsapp.net";
}