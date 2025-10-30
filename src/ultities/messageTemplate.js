/**
 * Tạo message thông báo thanh toán thành công
 * @param {Object} params
 * @param {string} params.userName - Tên người dùng hoặc email
 * @param {string} params.plan - "6_months" hoặc "12_months"
 * @param {Date} params.startDate - Ngày bắt đầu gói
 * @param {Date} params.endDate - Ngày kết thúc gói
 * @returns {{ title: string, content: string }}
 */
function SuccessPaymentMessage({ userName, plan, startDate, endDate }) {
  const planText =
    plan === "6_months"
      ? "6 tháng"
      : plan === "12_months"
      ? "12 tháng"
      : "Premium";

  const title = "Thanh toán thành công";

  const content = `
    <p>Xin chào <strong>${userName}</strong>,</p>
    <p>Chúng tôi rất vui thông báo rằng thanh toán gói <strong>Premium ${planText}</strong> của bạn đã được xử lý thành công.</p>
    <ul>
      <li><strong>Gói đã đăng ký:</strong> ${planText}</li>
      <li><strong>Ngày kích hoạt:</strong> ${startDate.toLocaleDateString()}</li>
      <li><strong>Ngày hết hạn:</strong> ${endDate.toLocaleDateString()}</li>
    </ul>
    <p>Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của chúng tôi.<br/>
    Hãy tận hưởng trải nghiệm Premium với những tính năng độc quyền và hỗ trợ ưu tiên!</p>
    <p>Trân trọng,<br/>Đội ngũ Hỗ trợ Khách hàng</p>
  `;

  return { title, content };
}

module.exports = { SuccessPaymentMessage };
