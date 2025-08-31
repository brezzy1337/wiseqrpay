Here's a **highly structured prompt** for **Aider Claude (Sonnet 3.5)** to generate a **Next.js + Node.js + tRPC + PostgreSQL** application that **integrates Wise API** for **QR-based recipient payments**.  

---

## **Prompt for Aider Claude (Sonnet 3.5)**
### **Title:** Wise API Integration with QR Code Payments  

### **System Instructions:**  
You are **Claude Sonnet 3.5**, acting as an **expert-level AI assistant for full-stack fintech development**. Your task is to generate a **Next.js + Node.js backend application** that integrates **Wise API** for recipient creation and payment initiation, using **tRPC for API communication** and **PostgreSQL for data storage**. The application must:  

1. **Fetch Account Requirements** from Wise API (`GET /v1/account-requirements`)  
2. **Create Recipients** based on Wise requirements (`POST /v1/recipients`)  
3. **Generate a Payment Link** (`POST /v1/transfers`)  
4. **Store the Payment URL** in **PostgreSQL** using Prisma ORM  
5. **Generate a QR Code** for users to scan  
6. **Redirect Users** to Wise App or Web-based payment page  

---

### **Development Stack:**  
- **Frontend:** Next.js (TypeScript)  
- **Backend:** Node.js with tRPC  
- **Database:** PostgreSQL (using Prisma ORM)  
- **API Integration:** Wise API  
- **QR Code Generation:** `qrcode` npm package  
- **Deployment:** Serverless (Vercel or Dockerized Backend)  

---

## **Step 1: Initialize the Project**
Generate a **Next.js full-stack app** using tRPC. Ensure **TypeScript and Prisma ORM** are set up.

```bash
npx create-t3-app@latest wise-qr-payments
cd wise-qr-payments
npm install @trpc/server @trpc/client @prisma/client @prisma/cli axios qrcode
```

---

## **Step 2: Set Up Wise API Environment Variables**
Require Wise API credentials in `.env`:

```env
WISE_API_KEY=your_wise_api_key
WISE_PROFILE_ID=your_profile_id
DATABASE_URL=postgresql://user:password@localhost:5432/wise_payments
```

---

## **Step 3: Define the Prisma Schema**
Create a **Prisma model** to store payment links:

```prisma
model Payment {
  id           String  @id @default(uuid())
  userId       String
  recipientId  String
  transferId   String
  paymentUrl   String
  qrCode       String
  createdAt    DateTime @default(now())
}
```

Run migrations:

```bash
npx prisma migrate dev --name init
```

---

## **Step 4: Implement Wise API Calls**

### **tRPC Endpoint: Create Dynamic Personal Profile Based on currency**

```typescript
createPersonalProfile: publicProcedure
 .input(z.object({
      firstName: z.string(),
      lastName: z.string(),
      dateOfBirth: z.string(),
      phoneNumber: z.string(),
    }))
    .mutation(async ({ input }) => {
      const response = await axios.post(
        "https://api.wise.com/v2/profiles/personal-profile",
        {
          type: "personal",
          details: input,
        },
        {
          headers: {
            Authorization: `Bearer ${env.WISE_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    }),
```

---

### **tRPC Endpoint: Create Dynamic Bussiness Profile Based on currency**

```typescript
  createBusinessProfile: publicProcedure
    .input(z.object({
      name: z.string(),
      registrationNumber: z.string(),
      companyType: z.string(),
      companyRole: z.string(),
      descriptionOfBusiness: z.string(),
      webpage: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const response = await axios.post(
        "https://api.wise.com/v2/profiles/business-profile",
        {
          type: "business",
          details: input,
        },
        {
          headers: {
            Authorization: `Bearer ${esnv.WISE_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    }),
});  
```

---

#### **tRPC Endpoint: Handle Profile Extension Requirements**
```typescript

  getExtensionRequirements: publicProcedure
    .input(z.object({
      profileId: z.string(),
    }))
    .query(async ({ input }) => {
      const response = await axios.get(
        `https://api.wise.com/v1/profiles/${input.profileId}/extension-requirements`,
        {
          headers: {
            Authorization: `Bearer ${env.WISE_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    }),

  updateProfileExtensions: publicProcedure
    .input(z.object({
      profileId: z.string(),
      extensions: z.record(z.any()),
    }))
    .mutation(async ({ input }) => {
      const response = await axios.post(
        `https://api.wise.com/v1/profiles
::contentReference[oaicite:0]{index=0}
 getExtensionRequirements: publicProcedure
  .input(z.object({ profileId: z.string(), type: z.string() }))
```


<!-- Discovered that Account Requirements are only needed for sending funds not recieving-->
// ### **tRPC Endpoint: Fetch Account Requirements**
// ```typescript
// import { publicProcedure, router } from "../trpc";
// import axios from "axios";

// export const wiseRouter = router({
//   getAccountRequirements: publicProcedure
//     .input(z.object({ source: z.string(), target: z.string(), amount: z.number() }))
//     .query(async ({ input }) => {
//       const { data } = await axios.get(`https://api.transferwise.com/v1/account-requirements`, {
//         params: {
//           source: input.source,
//           target: input.target,
//           sourceAmount: input.amount,
//         },
//         headers: { Authorization: `Bearer ${process.env.WISE_API_KEY}` },
//       });
//       return data;
//     }),
// });
// ``` 

---

//  The profile created needs to be a recipient for the transfer to be made 
### **tRPC Endpoint: Create Recipient**

```typescript
createRecipient: publicProcedure
  .input(z.object({ accountHolderName: z.string(), currency: z.string(), details: z.object({ abartn: z.string(), accountNumber: z.string() }) }))
  .mutation(async ({ input }) => {
    const { data } = await axios.post("https://api.transferwise.com/v1/recipients", {
      profile: process.env.WISE_PROFILE_ID,
      accountHolderName: input.accountHolderName,
      currency: input.currency,
      type: "aba",
      details: input.details,
    }, {
      headers: { Authorization: `Bearer ${process.env.WISE_API_KEY}` },
    });
    return data;
  });
```

---

### **tRPC Endpoint: Create Transfer & Generate Payment Link**
```typescript
createTransfer: publicProcedure
  .input(z.object({ recipientId: z.string(), amount: z.number(), currency: z.string() }))
  .mutation(async ({ input }) => {
    const { data } = await axios.post("https://api.transferwise.com/v1/transfers", {
      targetAccount: input.recipientId,
      source: "EUR",
      target: input.currency,
      sourceAmount: input.amount,
      customerTransactionId: `txn_${Date.now()}`,
    }, {
      headers: { Authorization: `Bearer ${process.env.WISE_API_KEY}` },
    });

    // Store payment link in database
    const payment = await prisma.payment.create({
      data: {
        userId: "test-user",
        recipientId: input.recipientId,
        transferId: data.id,
        paymentUrl: data.payInUrl,
      },
    });

    return { paymentUrl: data.payInUrl, transferId: data.id };
  });
```

---

## **Step 5: Generate QR Code for Payment URL**
```typescript
import QRCode from "qrcode";

generateQRCode: publicProcedure
  .input(z.object({ paymentUrl: z.string() }))
  .mutation(async ({ input }) => {
    const qr = await QRCode.toDataURL(input.paymentUrl);
    return { qrCode: qr };
  });
```

---

## **Step 6: Frontend QR Code Page**
```tsx
import { useRouter } from "next/router";
import { trpc } from "@/utils/trpc";

const PaymentQR = () => {
  const router = useRouter();
  const { paymentUrl } = router.query;
  const { data: qrCode } = trpc.wise.generateQRCode.useQuery({ paymentUrl });

  return (
    <div>
      <h2>Scan to Pay</h2>
      {qrCode && <img src={qrCode.qrCode} alt="QR Code" />}
      <button onClick={() => router.push(paymentUrl)}>Open Wise App</button>
    </div>
  );
};

export default PaymentQR;
```

---

## **Step 7: Redirect Users to Wise App**
Modify the **payment URL** to open directly in the Wise app:

```typescript
const wiseDeepLink = `wise://send?recipient=${recipientId}&amount=${amount}&currency=${currency}`;
router.push(wiseDeepLink);
```

---

## **Step 8: Deployment**
- Deploy **Next.js frontend** to **Vercel**
- Deploy **Node.js backend** with **Docker**
- Set up **PostgreSQL on Supabase or Railway.app**
- Use **NGINX reverse proxy** for security

---

## **Expected Outcome**
✅ **Users scan QR code** → Opens Wise App → **Recipient & Amount Pre-filled** → **One-Click Payment**.  

---

### **Final Instructions for Aider Claude (Sonnet 3.5)**  
1. **Generate all files & boilerplate code** for this app.  
2. **Ensure TypeScript is fully enforced** in all API calls.  
3. **Use environment variables for security** (e.g., `.env`).  
4. **Write tests using Jest for API functions**.  
5. **Optimize queries for large-scale transactions**.  

---

### **Next Steps**
Would you like me to refine the **Prisma schema** further or set up a **custom webhook listener** for completed payments? 🚀