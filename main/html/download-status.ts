export const DownloadStatusPage = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        margin: 0;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: #f3f4f6;
      }
      .container {
        text-align: center;
        padding: 20px;
        width: 100%;
      }
      .title {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 20px;
      }
      .progress-container {
        width: 80%;
        margin: 0 auto;
        background: #e5e7eb;
        border-radius: 8px;
        height: 8px;
        overflow: hidden;
      }
      .progress-bar {
        height: 100%;
        background: #4f46e5;
        transition: width 0.3s ease;
        width: 0%;
      }
      .progress-text {
        margin-top: 12px;
        font-size: 14px;
        color: #6b7280;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="title">Downloading update...</div>
      <div class="progress-container">
        <div class="progress-bar" id="progressBar"></div>
      </div>
      <div class="progress-text" id="progressText">0%</div>
    </div>
  </body>
</html>
`;
