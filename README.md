# Shree Ram Fund - Admin Dashboard

A complete web application for managing fund members, loans, and weekly collections with Supabase backend integration.

## 🚀 Features

### **Authentication System**
- **Admin Login**: Username: `Shreeramfund`, Password: `Shreeram@2025`
- **OTP Verification**: 6-digit OTP with 10-minute expiry
- **Secure Session Management**

### **Member Management**
- Add new members with weekly amounts (₹100, ₹200, ₹500, ₹1000)
- Track member status (Active/Inactive)
- Manage loan amounts and fine amounts
- Real-time member list updates

### **Loan Management System**
- **0.5% Weekly Interest**: Applied from week 2 onwards
- **Automatic Calculations**: Interest calculated on remaining loan amount
- **Loan History Tracking**: Complete payment and interest history

### **Dashboard Features**
- Real-time statistics display
- Member grid with detailed information
- Responsive design for all devices
- Beautiful animations and transitions

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL + Real-time API)
- **Styling**: Custom CSS with animations
- **Icons**: Font Awesome 6.0
- **Database**: PostgreSQL with real-time subscriptions

## 📁 Project Structure

```
shree-ram-fund/
├── index.html          # Main application file
├── style.css           # Styles and animations
├── app.js             # Application logic and Supabase integration
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## 🗄️ Database Schema

### **Tables in Supabase:**

1. **AdminUser**
   - `id` (Primary Key)
   - `username`
   - `password_hash`
   - `email`
   - `created_at`

2. **OTP**
   - `id` (Primary Key)
   - `admin_id` (Foreign Key to AdminUser)
   - `otp_code`
   - `expires_at`
   - `created_at`

3. **Members**
   - `id` (Primary Key)
   - `name`
   - `weekly_amount`
   - `status`
   - `total_paid`
   - `loan_amount`
   - `fine_amount`
   - `created_at`

4. **LoanHistory**
   - `id` (Primary Key)
   - `member_id` (Foreign Key to Members)
   - `loan_amount`
   - `paid_amount`
   - `week`
   - `interest`
   - `created_at`

## 🚀 Quick Start

### **Prerequisites**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for Supabase integration

### **Installation**
1. **Clone/Download** the project files
2. **Open** `index.html` in your browser
3. **Login** with the provided credentials
4. **Start managing** your fund members!

### **No Terminal Required**
Simply open `index.html` in your browser to run the application.

## 💰 Loan Calculation Logic

### **Weekly Interest System:**
- **Interest Rate**: 0.5% per week
- **Start Week**: Week 2 (after loan is taken)
- **Calculation**: `Remaining Loan × 0.005 = Weekly Interest`
- **Accumulation**: Interest is added to the loan amount each week

### **Example:**
- Member takes ₹10,000 loan in Week 1
- Week 2: Interest = ₹10,000 × 0.005 = ₹50
- New loan amount = ₹10,050
- Week 3: Interest = ₹10,050 × 0.005 = ₹50.25
- And so on...

## 🎨 UI Features

### **Animations:**
- **Page Transitions**: Smooth fade and slide effects
- **Card Animations**: Hover effects and entrance animations
- **Loading States**: Beautiful loading spinner
- **Form Interactions**: Input focus effects and button hover states

### **Responsive Design:**
- **Mobile First**: Optimized for all screen sizes
- **Grid Layouts**: Adaptive member cards and statistics
- **Touch Friendly**: Optimized for mobile devices

## 🔐 Supabase Configuration

The app is pre-configured with your Supabase instance:
- **URL**: `https://aenkpxtratzwftzuxzng.supabase.co`
- **Anonymous Key**: Already configured in `app.js`

## 📱 Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🚨 Important Notes

1. **Internet Required**: Supabase integration requires internet connection
2. **Data Persistence**: All data is stored in your Supabase database
3. **Security**: Admin credentials are hardcoded for demo purposes
4. **Real-time**: Changes sync automatically across all connected devices

## 🐛 Troubleshooting

### **Common Issues:**

1. **OTP Not Working**
   - Check internet connection
   - Verify Supabase credentials
   - Clear browser cache

2. **Members Not Loading**
   - Check browser console for errors
   - Verify Supabase table structure
   - Check network connectivity

3. **Styling Issues**
   - Ensure all CSS files are loaded
   - Check for browser compatibility
   - Clear browser cache

## 🔮 Future Enhancements

- [ ] Member payment tracking
- [ ] Advanced reporting and analytics
- [ ] Email/SMS notifications
- [ ] Multi-admin support
- [ ] Data export functionality
- [ ] Advanced loan management
- [ ] Fine calculation automation

## 📞 Support

For technical support or questions:
- Check browser console for error messages
- Verify Supabase connection
- Ensure all files are in the same directory

## 📄 License

This project is created for Shree Ram Fund management purposes.

---

**Ready to use!** Simply open `index.html` in your browser and start managing your fund members with this beautiful, animated web application.
