import s3 from "./s3Configure";



export async function uploadToS3(content, link) {
  const fileKey = link.split(".com/")[1];
  const uploadParams = {
    Bucket: 'tutor-staffroom-files',
    Key: fileKey,
    Body: content,
    ContentType: "text/html",
  };
  const res = await s3.upload(uploadParams).promise();
  console.log(res,"response received")
  const fileUrl = link;
  return fileUrl;
}
