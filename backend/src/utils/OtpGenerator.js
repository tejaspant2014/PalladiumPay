export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateOtpHtml = (otp) => {
  return `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #111;">
        <h2 style="color: #1a73e8;">Palladium Pay Email Verification</h2>
  
        <p>Your verification OTP is:</p>
  
        <div style="
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 6px;
          background: #f2f4f8;
          padding: 15px 20px;
          border-radius: 8px;
          display: inline-block;
          margin: 10px 0;
        ">
          ${otp}
        </div>
  
        <p>This OTP is valid for <b>10 minutes</b>.</p>
  
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;
};
