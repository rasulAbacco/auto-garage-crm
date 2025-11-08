// client/src/pages/details/utils/parseOCRText.js

export const parseOCRText = (text = "", confidence = 0) => {
    const cleaned = text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/[ ]{2,}/g, " ")
        .replace(/[^a-zA-Z0-9:/.,\-\n()&]/g, " ")
        .toUpperCase();

    const result = {
        regNo: "",
        regDate: "",
        formNumber: "",
        oSlNo: "",
        chassisNo: "",
        engineNo: "",
        mfr: "",
        model: "",
        vehicleClass: "",
        colour: "",
        body: "",
        wheelBase: "",
        mfgDate: "",
        fuel: "",
        regFcUpto: "",
        taxUpto: "",
        noOfCyl: "",
        unladenWt: "",
        seating: "",
        stdgSlpr: "",
        cc: "",
        ownerName: "",
        swdOf: "",
        address: "",
        ocrConfidence: confidence,
        extractedDate: new Date().toISOString(),
    };

    // 🔍 REGEX patterns for common RC formats
    const extract = (pattern) => {
        const match = cleaned.match(pattern);
        return match ? match[1].trim() : "";
    };

    // Registration Details
    result.regNo = extract(/REG(?:ISTRATION)?\s*NO[:\s-]*([A-Z0-9\-\/]+)/);
    result.regDate = extract(/REG(?:ISTRATION)?\.?DATE[:\s-]*([\d]{1,2}[-/][A-Z0-9]{2,}[-/][\d]{2,4})/);
    result.formNumber = extract(/FORM\s*NO[:\s-]*([A-Z0-9]+)/);
    result.oSlNo = extract(/O\.?\s*SL\.?\s*NO[:\s-]*([A-Z0-9]+)/);

    // Vehicle Identifiers
    result.chassisNo = extract(/CHASSIS(?:\.?NO)?[:\s-]*([A-Z0-9]+)/);
    result.engineNo = extract(/ENGINE(?:\.?NO)?[:\s-]*([A-Z0-9]+)/);
    result.mfr = extract(/MFR[:\s-]*([A-Z0-9 ]+)/) || extract(/MANUFACTURER[:\s-]*([A-Z0-9 ]+)/);
    result.model = extract(/MODEL[:\s-]*([A-Z0-9 \-]+)/);
    result.vehicleClass = extract(/CLASS[:\s-]*([A-Z0-9 ]+)/);
    result.colour = extract(/COLOUR[:\s-]*([A-Z ]+)/);
    result.body = extract(/BODY[:\s-]*([A-Z ]+)/);
    result.wheelBase = extract(/WHEEL\s*BASE[:\s-]*([0-9]+)/);
    result.mfgDate = extract(/MFG\.?\s*DATE[:\s-]*([0-9\-\/]+)/);
    result.fuel = extract(/FUEL[:\s-]*([A-Z\/]+)/);

    // Validity
    result.regFcUpto = extract(/REG\/?FC\s*(?:VALID\s*)?UPTO[:\s-]*([0-9\-\/]+)/);
    result.taxUpto = extract(/TAX\s*(?:VALID\s*)?UPTO[:\s-]*([0-9\-\/]+)/);

    // Specs
    result.noOfCyl = extract(/NO\.?\s*OF\s*CYL[:\s-]*([0-9]+)/);
    result.unladenWt = extract(/UNLADEN\s*WT[:\s-]*([0-9]+)/);
    result.seating = extract(/SEATING[:\s-]*([0-9]+)/);
    result.stdgSlpr = extract(/STDG\/?SLPR[:\s-]*([A-Z0-9]+)/);
    result.cc = extract(/CC[:\s-]*([0-9]+)/);

    // Ownership
    result.ownerName = extract(/OWNER\s*NAME[:\s-]*([A-Z0-9\/&., ]+)/);
    result.swdOf = extract(/S\/W\/D\s*OF[:\s-]*([A-Z0-9 ]+)/);

    // Address (handles multiline addresses)
    const addressMatch = cleaned.match(/ADDRESS[:\s-]*([\s\S]*?)(?:MFR|BODY|CLASS|WHEEL|FUEL|$)/);
    if (addressMatch) {
        result.address = addressMatch[1].replace(/\n/g, " ").trim();
    }

    // Trim all fields
    for (const key in result) {
        if (typeof result[key] === "string") {
            result[key] = result[key].replace(/\s{2,}/g, " ").trim();
        }
    }

    return result;
};
