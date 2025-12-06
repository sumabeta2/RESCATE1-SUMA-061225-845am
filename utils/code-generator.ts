import { AccessCode } from '../types';

export const generateInitialCodes = (): AccessCode[] => {
  const codes: AccessCode[] = [];
  const usedCodes = new Set<string>();

  const generateCode = (startWithZero: boolean): string => {
    let code = '';
    do {
      if (startWithZero) {
        // 0 + 5 random digits
        code = '0' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      } else {
        // Random number between 100000 and 999999
        code = Math.floor(100000 + Math.random() * 900000).toString();
      }
    } while (usedCodes.has(code));
    usedCodes.add(code);
    return code;
  };

  // Generate 30 codes for 24H (Starting with 0)
  for (let i = 0; i < 30; i++) {
    codes.push({
      code: generateCode(true),
      type: '24H',
      status: 'AVAILABLE',
      createdAt: new Date().toISOString()
    });
  }

  // Generate 30 codes for MONTHLY (Not starting with 0)
  for (let i = 0; i < 30; i++) {
    codes.push({
      code: generateCode(false),
      type: 'MONTHLY',
      status: 'AVAILABLE', // Monthly codes start available, Admin activates/assigns them
      createdAt: new Date().toISOString()
    });
  }

  return codes;
};