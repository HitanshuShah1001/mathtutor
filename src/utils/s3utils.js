import AWS from "aws-sdk";

const s3 = new AWS.S3();

export async function uploadToS3(content, link) {
  const fileKey = link.split(".com/")[1]; // This wi
  const uploadParams = {
    Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
    Key: fileKey,
    Body: content,
    ContentType: "text/html",
  };
  await s3.upload(uploadParams).promise();
  const fileUrl = link;
  return fileUrl;
}
