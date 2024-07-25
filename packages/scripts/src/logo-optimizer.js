const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client();

// Function to generate WebP images in different sizes and DPRs
const generateWebPImages = async (inputPath, outputDir, sizes, dprs) => {
  console.log("Optimizing Logo Image ...");

  for (const size of sizes) {
    for (const dpr of dprs) {
      const scaledSize = size * dpr;
      const outputPath = path.join(outputDir, `logo-${size}w-${dpr}x.webp`);
      await sharp(inputPath)
        .resize(scaledSize)
        .webp({ quality: 80 })
        .toFile(outputPath);
    }
  }
};

// Function to upload files to S3
const uploadFileToS3 = async (filePath, key) => {
  if (!process.env.ASSETS_BUCKET) {
    console.error("ASSETS_BUCKET not defined");
    return;
  }
  const bucketName = process.env.ASSETS_BUCKET;

  const fileContent = fs.readFileSync(filePath);
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
    ContentType: "image/webp",
  };

  await s3.send(new PutObjectCommand(params));
};

const handler = async () => {
  console.log("(Script) :: Logo-Optimizer initiated ...");

  const basePath = `${process.cwd()}/packages/scripts/src`;

  // Define input and output directories
  const logoFilename = "logo.png";
  const inputDir = `${basePath}/assets-input/logo`;
  const outputDir = `${basePath}/assets-output/logo`;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Define sizes and DPRs
  const sizes = [16, 32, 48, 64, 128];
  const dprs = [1, 2, 3];

  try {
    const inputPath = path.join(inputDir, logoFilename);
    await generateWebPImages(inputPath, outputDir, sizes, dprs);
    const files = fs.readdirSync(outputDir);

    console.log(
      `Uploading to s3 bucket ${process.env.ASSETS_BUCKET} Optimized Logo Images ...`
    );

    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const key = `logos/${file}`;
      await uploadFileToS3(filePath, key);
    }

    console.log("All Logo Images generated and uploaded successfully!");
  } catch (err) {
    console.log("An error occured in Logo Image Optimizer", err);
  }
};

handler();
