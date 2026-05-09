export const cancelTemplate = () => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Payment Cancelled</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #fef2f2;
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
          color: #dc2626;
        }
        h1 {
          color: #b91c1c;
          margin-top: 1rem;
        }
        p {
          color: #4b5563;
        }
        a {
          display: inline-block;
          margin-top: 1rem;
          padding: 0.6rem 1.2rem;
          background: #dc2626;
          color: #fff;
          border-radius: 6px;
          text-decoration: none;
        }
        a:hover {
          background: #b91c1c;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">❌</div>
        <h1>Payment Cancelled</h1>
        <p>Your transaction was not completed. You can try again anytime.</p>
        <a href="https://cityadventuredating.com/user-profile/subscription">Return to Homepage</a>
      </div>
    </body>
    </html>
  `;
};
