export const successTemplate = () => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Payment Successful</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f0fdf4;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          text-align: center;
          padding: 2rem;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .icon {
          font-size: 50px;
          color: #22c55e;
        }
        h1 {
          color: #15803d;
          margin-top: 1rem;
        }
        p {
          color: #4b5563;
        }
        a {
          display: inline-block;
          margin-top: 1rem;
          padding: 0.6rem 1.2rem;
          background: #16a34a;
          color: #fff;
          border-radius: 6px;
          text-decoration: none;
        }
        a:hover {
          background: #15803d;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">✅</div>
        <h1>Payment Successful!</h1>
        <p>Thank you for your purchase. Your transaction has been completed.</p>
        <a href="https://cityadventuredating.com/user-profile/subscription">Go to Homepage</a>
      </div>
    </body>
    </html>
  `;
};
