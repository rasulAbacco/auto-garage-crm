export const parseOCRText = (text, confidence = 0) => {
  if (!text) return {};

  try {
    let cleanedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Improved confidence-based cleaning
    if (confidence < 50) {
      cleanedText = cleanedText.replace(/\b[A-Za-z]\b/g, ' ');
      cleanedText = cleanedText.replace(/[^a-zA-Z0-9\s\n\-\/\.,:]/g, ' ');
    }

    const lines = cleanedText.split('\n').map(line => line.trim()).filter(line => line);
    
    const result = {
      regNo: "", regDate: "", formNumber: "", oSlNo: "",
      chassisNo: "", engineNo: "", mfr: "", model: "",
      vehicleClass: "", colour: "", body: "", wheelBase: "",
      mfgDate: "", fuel: "", regFcUpto: "", taxUpto: "",
      noOfCyl: "", unladenWt: "", seating: "", stdgSlpr: "",
      cc: "", ownerName: "", swdOf: "", address: "",
      ocrConfidence: confidence,
      extractedDate: new Date().toISOString()
    };

    if (cleanedText.length < 3 || !/[a-zA-Z]/.test(cleanedText)) return result;

    // Helper function to find value after a label
    const findValueAfterLabel = (label, options = {}) => {
      const { multiline = false, nextLineOnly = false, exactMatch = false } = options;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const regex = exactMatch 
          ? new RegExp(`\\b${label}\\b`, 'gi')
          : new RegExp(label, 'gi');
        
        if (regex.test(line)) {
          const colonIndex = line.search(/[:]/);
          if (colonIndex !== -1) {
            let value = line.substring(colonIndex + 1).trim();
            // Clean up common OCR artifacts
            value = value.replace(/[~!@#$%^&*()_+\-=\[\]{};':"\\|<>\/?]+/g, ' ').trim();
            
            // If we're looking for a specific value pattern, extract it
            if (options.pattern) {
              const match = value.match(options.pattern);
              if (match) return match[0];
            }
            
            if (value && value.length > 0) return value;
          }
          
          // If no colon, try to extract value from the same line
          if (!line.includes(':')) {
            const labelIndex = line.search(regex);
            if (labelIndex !== -1) {
              let value = line.substring(labelIndex + label.length).trim();
              value = value.replace(/[~!@#$%^&*()_+\-=\[\]{};':"\\|<>\/?]+/g, ' ').trim();
              
              if (options.pattern) {
                const match = value.match(options.pattern);
                if (match) return match[0];
              }
              
              if (value && value.length > 0) return value;
            }
          }
          
          // Check next line if no value found on current line
          if (i + 1 < lines.length && (nextLineOnly || !line.includes(':'))) {
            const nextLine = lines[i + 1].trim();
            if (nextLine && nextLine.length > 0) {
              let value = nextLine.replace(/[~!@#$%^&*()_+\-=\[\]{};':"\\|<>\/?]+/g, ' ').trim();
              
              if (options.pattern) {
                const match = value.match(options.pattern);
                if (match) return match[0];
              }
              
              return value;
            }
          }
          
          // For multiline fields like address
          if (multiline && i + 1 < lines.length) {
            let addressLines = [];
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
              const nextLine = lines[j].trim();
              if (nextLine && !/^(FORM|REG|CHASSIS|ENGINE|MFR|MODEL|CLASS|COLOUR|BODY|WHEEL|BASE|MFG|FUEL|REGFC|TAX|NOOFCYL|UNLADEN|SEATING|STDG|CC|OWNERNAME|SWDOF|ADDRESS)$/i.test(nextLine)) {
                addressLines.push(nextLine);
              } else break;
            }
            if (addressLines.length > 0) return addressLines.join(', ');
          }
        }
      }
      return "";
    };

    // Extract Registration Number
    const findRegNo = () => {
      // First try: Look for REG NO followed by alphanumeric string
      for (const line of lines) {
        if (/REG\s*NO/i.test(line)) {
          const match = line.match(/REG\s*NO\s*[:\s]*([A-Z0-9]+)/i);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
      }
      
      // Second try: Look for any alphanumeric string that looks like a registration number
      const patterns = [
        /\b([A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4})\b/gi,  // Format like KA01AB1234
        /\b([A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4})\b/gi,  // More flexible format
        /\b([A-Z0-9]{8,12})\b/gi,  // Any 8-12 character alphanumeric string
      ];
      
      for (const pattern of patterns) {
        const match = cleanedText.match(pattern);
        if (match) {
          // Clean up any extra characters
          const cleaned = match[0].replace(/[^A-Z0-9]/gi, '').trim();
          if (cleaned.length >= 8 && cleaned.length <= 12) return cleaned;
        }
      }
      return "";
    };

    // Extract Date
    const findDate = (label) => {
      const value = findValueAfterLabel(label);
      // Look for date patterns like DD-MM-YYYY, DD/MM/YYYY, DD MM YYYY
      const datePatterns = [
        /\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/,  // DD-MM-YYYY or DD/MM/YYYY
        /\d{1,2}\s\d{1,2}\s\d{4}/,       // DD MM YYYY
        /\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/,  // YYYY-MM-DD
      ];
      
      for (const pattern of datePatterns) {
        const dateMatch = value.match(pattern);
        if (dateMatch) return dateMatch[0];
      }
      return value;
    };

    // Extract Chassis Number - FIXED with better pattern matching
    const findChassisNumber = () => {
      // Try to find the label and extract from the same line
      for (let i = 0; i < lines.length; i++) {
        if (/CHASSIS\s*NO/i.test(lines[i])) {
          // Extract value after the label
          const match = lines[i].match(/CHASSIS\s*NO\s*[:\s]*([A-Z0-9]+)/i);
          if (match && match[1]) {
            return match[1].trim();
          }
          
          // If no match on same line, try next line
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            const chassisMatch = nextLine.match(/([A-Z0-9]{10,20})/i);
            if (chassisMatch) {
              return chassisMatch[1].trim();
            }
          }
        }
      }
      
      // Try direct extraction with pattern
      const value = findValueAfterLabel('CHASSIS\\.?\\s*NO');
      if (value) {
        const chassisMatch = value.match(/([A-Z0-9]{10,20})/i);
        if (chassisMatch) {
          return chassisMatch[1].trim();
        }
      }
      
      // Fallback: Look for any 10-20 character alphanumeric string that might be a chassis number
      for (const line of lines) {
        const chassisMatch = line.match(/([A-Z0-9]{10,20})/i);
        if (chassisMatch) {
          return chassisMatch[1].trim();
        }
      }
      
      return "";
    };

    // Extract Engine Number - FIXED with better pattern matching
    const findEngineNumber = () => {
      // Try to find the label and extract from the same line
      for (let i = 0; i < lines.length; i++) {
        if (/ENGINE\s*NO/i.test(lines[i])) {
          // Extract value after the label
          const match = lines[i].match(/ENGINE\s*NO\s*[:\s]*([A-Z0-9]+)/i);
          if (match && match[1]) {
            return match[1].trim();
          }
          
          // If no match on same line, try next line
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            const engineMatch = nextLine.match(/([A-Z0-9]{6,20})/i);
            if (engineMatch) {
              return engineMatch[1].trim();
            }
          }
        }
      }
      
      // Try direct extraction with pattern
      const value = findValueAfterLabel('ENGINE\\.?\\s*NO');
      if (value) {
        const engineMatch = value.match(/([A-Z0-9]{6,20})/i);
        if (engineMatch) {
          return engineMatch[1].trim();
        }
      }
      
      // Fallback: Look for any 6-20 character alphanumeric string that might be an engine number
      for (const line of lines) {
        const engineMatch = line.match(/([A-Z0-9]{6,20})/i);
        if (engineMatch) {
          return engineMatch[1].trim();
        }
      }
      
      return "";
    };

    // Extract Form Number - FIXED to extract only the form name
    const findFormNumber = () => {
      // Try to extract form number from the FORM line
      for (let i = 0; i < lines.length; i++) {
        if (/FORM/i.test(lines[i])) {
          // Look for form number pattern like FORM-29 or FORM 29
          const formMatch = lines[i].match(/FORM\s*[:\-]?\s*(\d+[A-Z]?)/i);
          if (formMatch) {
            return formMatch[1];
          }
        }
      }
      
      // If we have a line like "REG NO KAOANF6316 Foruza", extract only "Foruza" as form number
      for (let i = 0; i < lines.length; i++) {
        if (/REG NO/i.test(lines[i])) {
          // Extract the last word which might be the form number
          const words = lines[i].split(' ');
          if (words.length > 2) {
            const lastWord = words[words.length - 1];
            // Check if it's not part of the registration number
            if (!/^[A-Z0-9]+$/.test(lastWord) || lastWord.length < 8) {
              return lastWord;
            }
          }
        }
      }
      
      return "";
    };

    // Extract O.SL.NO - FIXED to extract only the number
    const findOSlNo = () => {
      // Try direct extraction
      const value = findValueAfterLabel('O\\.SL\\.NO');
      if (value) {
        // Extract the last part that looks like a number
        const match = value.match(/(\d+)$/);
        if (match) {
          return match[1];
        }
        return value;
      }
      
      // Try pattern matching
      const pattern = /O\.SL\.NO\s*(\d+)/i;
      const match = cleanedText.match(pattern);
      if (match) {
        return match[1];
      }
      
      return "";
    };

    // Extract color - FIXED to extract only the color name
    const findColor = () => {
      // Try direct extraction
      const value = findValueAfterLabel('COLOUR');
      if (value) {
        // Extract the part after "COLOUR" if present
        const colorMatch = value.match(/COLOUR\s*([A-Za-z\s]+)$/i);
        if (colorMatch) {
          return colorMatch[1].trim();
        }
        
        // If the line is like "Z12ENF107447 COLOUR Pear Arctic", extract only "Pear Arctic"
        const parts = value.split('COLOUR');
        if (parts.length > 1) {
          return parts[1].trim();
        }
        
        return value;
      }
      
      return "";
    };

    // Extract body type - FIXED to extract only the body type
    const findBody = () => {
      // Try direct extraction
      const value = findValueAfterLabel('BODY');
      if (value) {
        // Extract the part before any numbers or special codes
        const bodyMatch = value.match(/^([A-Za-z\s]+)/);
        if (bodyMatch) {
          return bodyMatch[1].trim();
        }
        
        // If the line is like "RIGID PASSENGER CNOOFCYL 3", extract only "RIGID PASSENGER"
        const parts = value.split('CNOOFCYL');
        if (parts.length > 0) {
          return parts[0].trim();
        }
        
        return value;
      }
      
      return "";
    };

    // Extract wheel base - FIXED to extract only the wheel base number
    const findWheelBase = () => {
      // Try to extract from the WHEEL BASE line
      for (let i = 0; i < lines.length; i++) {
        if (/WHEEL\s*BASE/i.test(lines[i])) {
          // Extract the number before "UNLADEN WT"
          const wheelBaseMatch = lines[i].match(/(\d+)\s*UNLADEN\s*WT/i);
          if (wheelBaseMatch) {
            return wheelBaseMatch[1];
          }
          
          // Extract the first number in the line
          const numberMatch = lines[i].match(/(\d+)/);
          if (numberMatch) {
            return numberMatch[1];
          }
        }
      }
      
      // Try direct extraction
      const wheelBaseValue = findValueAfterLabel('WHEEL\\s*BASE');
      if (wheelBaseValue) {
        const wheelBaseMatch = wheelBaseValue.match(/(\d+)/);
        if (wheelBaseMatch) {
          return wheelBaseMatch[1];
        }
      }
      
      return "";
    };

    // Extract unladen weight - FIXED to extract only the unladen weight number
    const findUnladenWt = () => {
      // Try to extract from the UNLADEN WT line
      for (let i = 0; i < lines.length; i++) {
        if (/UNLADEN\s*WT/i.test(lines[i])) {
          // Extract the number after "UNLADEN WT"
          const unladenMatch = lines[i].match(/UNLADEN\s*WT\s*(\d+)/i);
          if (unladenMatch) {
            return unladenMatch[1];
          }
          
          // Extract the last number in the line
          const numbers = lines[i].match(/\d+/g);
          if (numbers && numbers.length > 0) {
            return numbers[numbers.length - 1];
          }
        }
      }
      
      // Try direct extraction
      const unladenWtValue = findValueAfterLabel('UNLADEN\\s*WT');
      if (unladenWtValue) {
        const unladenWtMatch = unladenWtValue.match(/(\d+)/);
        if (unladenWtMatch) {
          return unladenWtMatch[1];
        }
      }
      
      return "";
    };

    // Extract seating capacity - FIXED to extract only the seating number
    const findSeating = () => {
      // Try direct extraction
      const value = findValueAfterLabel('SEATING');
      if (value) {
        // Extract the number
        const seatingMatch = value.match(/(\d+)/);
        if (seatingMatch) {
          return seatingMatch[1];
        }
        
        // If the line is like "06 2025 SEATING o § ra", extract only "06"
        const parts = value.split(' ');
        if (parts.length > 0 && /^\d+$/.test(parts[0])) {
          return parts[0];
        }
        
        return value;
      }
      
      return "";
    };

    // Extract address - NEW APPROACH FOR FULL ADDRESS CAPTURE
    const findAddress = () => {
      // List of major field labels that are likely to come after the address
      const majorFieldsAfterAddress = [
        'CHASSIS NO', 'ENGINE NO', 'MFR', 'MODEL', 'CLASS', 'COLOUR', 
        'BODY TYPE', 'WHEEL BASE', 'UNLADEN WT', 'MFG DATE', 'FUEL TYPE',
        'REG/FC VALID UPTO', 'TAX VALID UPTO', 'NO. OF CYLINDERS', 
        'SEATING CAPACITY', 'STDG/SLPR', 'CC (CUBIC CAPACITY)'
      ];

      // Helper function to check if a line is a major field that comes after address
      const isMajorFieldAfterAddress = (line) => {
        return majorFieldsAfterAddress.some(field => 
          line.toUpperCase().includes(field.toUpperCase())
        );
      };

      // Method 1: Look for OWNER NAME and then capture until a major field
      let ownerNameIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (/OWNER\s*NAME/i.test(lines[i])) {
          ownerNameIndex = i;
          break;
        }
      }

      if (ownerNameIndex !== -1) {
        let addressLines = [];
        // Start from the line after OWNER NAME
        for (let i = ownerNameIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue; // skip empty lines

          // If we hit a major field that comes after address, stop
          if (isMajorFieldAfterAddress(line)) {
            break;
          }

          addressLines.push(line);
        }

        if (addressLines.length > 0) {
          return addressLines.join(', ');
        }
      }

      // Method 2: Look for ADDRESS label and capture until a major field
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/ADDRESS/i.test(line)) {
          let addressLines = [];
          // Start from the line after ADDRESS
          for (let j = i + 1; j < lines.length; j++) {
            const currentLine = lines[j].trim();
            if (!currentLine) continue; // skip empty lines

            // If we hit a major field that comes after address, stop
            if (isMajorFieldAfterAddress(currentLine)) {
              break;
            }

            addressLines.push(currentLine);
          }

          if (addressLines.length > 0) {
            return addressLines.join(', ');
          }
        }
      }

      // Method 3: Look for a block of text that looks like an address and capture until a major field
      // We'll look for lines that have address keywords and then capture until a major field
      const addressKeywords = [
        'road', 'street', 'village', 'nagar', 'colony', 'apartment', 
        'building', 'tower', 'block', 'sector', 'phase', 'layout', 'area', 
        'district', 'state', 'pin', 'postal', 'near', 'opposite', 'behind',
        'house', 'h.no', 'hno', 'flat', 'room', 'plot', 'lane', 'avenue'
      ];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();

        // Check if this line contains an address keyword
        if (addressKeywords.some(keyword => lowerLine.includes(keyword))) {
          let addressLines = [line];

          // Look ahead for more address lines
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j].trim();
            if (!nextLine) continue; // skip empty lines

            // If we hit a major field that comes after address, stop
            if (isMajorFieldAfterAddress(nextLine)) {
              break;
            }

            addressLines.push(nextLine);
          }

          if (addressLines.length > 0) {
            return addressLines.join(', ');
          }
        }
      }

      // Method 4: If we still haven't found an address, try to capture everything between OWNER NAME and CHASSIS NO or ENGINE NO
      if (ownerNameIndex !== -1) {
        let chassisIndex = -1;
        let engineIndex = -1;

        // Find CHASSIS NO
        for (let i = ownerNameIndex + 1; i < lines.length; i++) {
          if (/CHASSIS\s*NO/i.test(lines[i])) {
            chassisIndex = i;
            break;
          }
        }

        // Find ENGINE NO
        for (let i = ownerNameIndex + 1; i < lines.length; i++) {
          if (/ENGINE\s*NO/i.test(lines[i])) {
            engineIndex = i;
            break;
          }
        }

        // Determine the next field index (whichever comes first)
        let nextFieldIndex = -1;
        if (chassisIndex !== -1 && engineIndex !== -1) {
          nextFieldIndex = Math.min(chassisIndex, engineIndex);
        } else if (chassisIndex !== -1) {
          nextFieldIndex = chassisIndex;
        } else if (engineIndex !== -1) {
          nextFieldIndex = engineIndex;
        }

        if (nextFieldIndex !== -1) {
          let addressLines = [];
          for (let i = ownerNameIndex + 1; i < nextFieldIndex; i++) {
            const line = lines[i].trim();
            if (line) {
              addressLines.push(line);
            }
          }

          if (addressLines.length > 0) {
            return addressLines.join(', ');
          }
        }
      }

      // Method 5: Last resort - capture all lines between OWNER NAME and the next field that has a colon
      if (ownerNameIndex !== -1) {
        let nextFieldWithColonIndex = -1;
        
        // Find the next line that has a colon and looks like a field
        for (let i = ownerNameIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (/:/.test(line) && line.length < 50) {
            // Check if it looks like a field label (all caps or mostly caps)
            const upperCaseRatio = (line.match(/[A-Z]/g) || []).length / line.length;
            if (upperCaseRatio > 0.5) {
              nextFieldWithColonIndex = i;
              break;
            }
          }
        }

        if (nextFieldWithColonIndex !== -1) {
          let addressLines = [];
          for (let i = ownerNameIndex + 1; i < nextFieldWithColonIndex; i++) {
            const line = lines[i].trim();
            if (line) {
              addressLines.push(line);
            }
          }

          if (addressLines.length > 0) {
            return addressLines.join(', ');
          }
        }
      }

      // If all methods fail, return empty string
      return "";
    };

    // Extract all fields with the fixed functions
    result.regNo = findRegNo();
    result.regDate = findDate('REG\\.?\\s*DATE');
    result.formNumber = findFormNumber();
    result.oSlNo = findOSlNo();
    result.chassisNo = findChassisNumber();
    result.engineNo = findEngineNumber();
    result.mfr = findValueAfterLabel('MFR');
    result.model = findValueAfterLabel('MODEL');
    result.vehicleClass = findValueAfterLabel('CLASS');
    result.colour = findColor();
    result.body = findBody();
    result.wheelBase = findWheelBase();
    result.mfgDate = findDate('MFG\\.?\\s*DATE');
    result.fuel = findValueAfterLabel('FUEL');
    result.regFcUpto = findDate('REG\\/FC\\s*UPTO');
    result.taxUpto = findValueAfterLabel('TAX\\s*UPTO');
    result.noOfCyl = findValueAfterLabel('NO\\.OF\\s*CYL');
    result.unladenWt = findUnladenWt();
    result.seating = findSeating();
    result.stdgSlpr = findValueAfterLabel('STDG\\/SLPR');
    result.cc = findValueAfterLabel('CC');
    result.ownerName = findValueAfterLabel('OWNERNAME');
    result.swdOf = findValueAfterLabel('S\\/W\\/D\\s*OF');
    result.address = findAddress();

    return result;
  } catch (error) {
    return { rawText: text, parseError: error.message, ocrConfidence: confidence };
  }
};