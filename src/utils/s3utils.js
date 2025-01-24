import AWS from "aws-sdk";

const s3 = new AWS.S3();

export async function uploadToS3(content, name) {
  const fileKey = `questionPapers/${name}.html`;
  const uploadParams = {
    Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
    Key: fileKey,
    Body: content,
    ContentType: "text/html",
  };

  await s3.upload(uploadParams).promise();
  const fileUrl = `https://${process.env.REACT_APP_S3_BUCKET_NAME}.s3.${process.env.REACT_APP_AWS_REGION}.amazonaws.com/${fileKey}`;
  return fileUrl;
}
