import express from "express";
import cors from "cors";
const app = express();
app.use(cors());

import multer from "multer"
import exec from "await-exec";
import fs from "fs"
import Bucket from "backblaze";

const bucket = Bucket("pdf-edited", {
  id: "000ed926d44f3f90000000004",
  key: "K0009dbfN4RKFi2eOdW7XMwbOzyYEdw",
});



const upload = multer({ dest: '/temp/' })

//app.use('/uploads', express.static('uploads'))

app.post('/upload', upload.single('pdfFile'), async function (req, res) {
  
  req.socket.setTimeout(10 * 60 * 1000)
 
 function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}

if (!req.file) {
  res.json({status : 404, error: "No pdf given"})
}else{

const filename = `${req.file.filename}-output`;

const output = `/temp/${filename}.pdf`;
const output1 = `/temp/${filename}-1.pdf`;
const output2 = `/temp/${filename}-2.pdf`;

if (!req.body.pdfLimit) {
  const input = req.file.path;
    const compressStatus = await compressPdf(input, output, 120);
    if (compressPdf) {
      const file = await bucket.upload(output);
    console.log(file)
    res.json(file)
    }
    if(!compressPdf) {
      res.json({status : 404, error: "Error occured during Compression"})
    }
} else {
  const fileLimit =  req.body.pdfLimit * 1000;
 console.log(fileLimit)

const input = req.file.path;
console.log(input)

const compressStatus1 = await compressPdf(input, output1, 25)

const compressStatus2 = await compressPdf(input, output2, 50)


if (compressStatus2) {
  
 await console.log(compressStatus2)
 
  const fileStats1 = await fs.statSync(output1);
  const fileSizeInBytes1 = fileStats1.size;
  console.log(fileSizeInBytes1)
  
  const fileStats2 = await fs.statSync(output2);
  const fileSizeInBytes2 = fileStats2.size;
  console.log(fileSizeInBytes2)
  
  
    //dpi = Math.round(Math.sqrt((dpi * dpi) * (fileLimit / (fileSizeInBytes * 2))))
   //const a = Math.round(Math.sqrt((fileLimit / fileSizeInBytes) * dpi * dpi))
   const a = getBaseLog((25 / 50), (fileSizeInBytes1 / fileSizeInBytes2))
   console.log(a)
   const b = (fileSizeInBytes1 / Math.pow(25,a))
   const dpi = (Math.floor(Math.pow((fileLimit / b), (1 / a))) - 1)
    console.log(dpi)
    const compressStatus = await compressPdf(input, output, dpi);
    if (compressPdf) {
      const file = await bucket.upload(output);
    console.log(file)
    res.json(file)
    } else {
      res.json({status : 404, error: "Error occured during Compression"})

    }
    
  
  
  
}
if(!compressStatus2){
      res.json({status : 404, error: "Error occured during Compression"})
}
}
}
   
});

async function compressPdf  (input, output, dpi) {
  try {
    await  exec(
      `gs \ -q -dNOPAUSE -dBATCH -dSAFER \ -sDEVICE=pdfwrite \ -dCompatibilityLevel=1.3 \ -dPDFSETTINGS=/ebook \ -dEmbedAllFonts=true \ -dSubsetFonts=true \ -dAutoRotatePages=/None \ -dDownsampleColorImages=true \ -dColorImageDownsampleType=/Bicubic \ -dColorImageResolution=${dpi} \ -dGrayImageDownsampleType=/Bicubic \ -dGrayImageResolution=${dpi} \ -dMonoImageDownsampleType=/Subsample \ -dMonoImageResolution=${dpi} \ -sOutputFile=${output} \ ${input}`)
        console.log("done")
        return true
  } catch (err) {
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