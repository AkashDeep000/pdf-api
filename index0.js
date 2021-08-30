import express from "express";
const app = express()
import multer from "multer"
import exec from "await-exec";
import fs from "fs"
import Bucket from "backblaze";

const bucket = Bucket("bucket-name", {
  id: "000ed926d44f3f90000000004",
  key: "K0009dbfN4RKFi2eOdW7XMwbOzyYEdw",
});


const upload = multer({ dest: './uploads/' })

app.use('/uploads', express.static('uploads'))

app.post('/upload', upload.single('pdfFile'), async function (req, res, file) {
 
 
 function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}

   console.log(req.file.size)
 const fileLimit =  req.body.fileLimit * 1000;
 console.log(fileLimit)
let dpi = 150;
const output = `../../sdcard/Download/output-compressed.pdf`;
const output1 = `../../sdcard/Download/output-compressed1.pdf`;
const output2 = `../../sdcard/Download/output-compressed2.pdf`;
const input = req.file.path;

const compressStatus1 = await compressPdf(input, output1, 50)
const compressStatus2 = await compressPdf(input, output2, 75)


if (compressStatus2) {
  
 await console.log(compressStatus2)
 
  const fileStats1 = await fs.statSync(output1);
  const fileSizeInBytes1 = fileStats1.size;
  console.log(fileSizeInBytes1)
  
  const fileStats2 = await fs.statSync(output2);
  const fileSizeInBytes2 = fileStats2.size;
  console.log(fileSizeInBytes2)
  
  if (fileLimit > fileSizeInBytes2) {
    res.send("1st success")
  }else{
    //dpi = Math.round(Math.sqrt((dpi * dpi) * (fileLimit / (fileSizeInBytes * 2))))
   //const a = Math.round(Math.sqrt((fileLimit / fileSizeInBytes) * dpi * dpi))
   const a = getBaseLog((50 / 75), (fileSizeInBytes1 / fileSizeInBytes2))
   console.log(a)
   const b = (fileSizeInBytes1 / Math.pow(50,a))
   dpi = (Math.floor(Math.pow((fileLimit / b), (1 / a))) - 1)
    console.log(dpi)
    const compressStatus = await compressPdf(input, output, dpi);
   // const file = await bucket.upload(output);
   // console.log(file)
    res.send("2nd success")
    
  }
  
  
}
if(!compressStatus2){
  res.send("Error")
}
   
});

async function compressPdf  (input, output, dpi) {
  try {
    await  exec(
      `gs \ -q -dNOPAUSE -dBATCH -dSAFER \ -sDEVICE=pdfwrite \ -dCompatibilityLevel=1.3 \ -dPDFSETTINGS=/ebook \ -dEmbedAllFonts=true \ -dSubsetFonts=true \ -dAutoRotatePages=/None \ -dDownsampleColorImages=true \ -dColorImageDownsampleType=/Bicubic \ -dColorImageResolution=${dpi} \ -dGrayImageDownsampleType=/Bicubic \ -dGrayImageResolution=${dpi} \ -dMonoImageDownsampleType=/Subsample \ -dMonoImageResolution=${dpi} \ -sOutputFile=${output} \ ${input}`)
        console.log("done")
        return true
  } catch (e) {
    console.log(err)
            return false
  }
/* ,
      (err) => {
        if (err) {
          console.log(err)
            return false
          }
          console.log("done")
          return true
        })*/
  
        
}

app.listen(5000,() => {
console.log("App is listening on Port 5000");
})