import express from "express";
const app = express();

import cors from "cors";
app.use(cors({
  origin: "*",
  allowedHeaders: ['Origin','X-Requested-With','Content-Type', 'Authorization'],
  maxAge: 864000,
   "preflightContinue": true,
}));

import multer from "multer"
import exec from "await-exec";
import fs from "fs"




const upload = multer({ dest: '/mnt/file/' })

app.use('/file/', express.static('/mnt/file'))

app.post('/upload', upload.single('pdfFile'), async function (req, res, next) {
  
  req.socket.setTimeout(10 * 60 * 1000)
// console.log(req)
 function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}

if (!req.file) {
  res.json({status : 404, error: "No pdf given"})
}else{

const filename = `${req.file.originalname.slice(0, -4).replace(/\s+/g, '-')}-output-${Date.now()}`;
//console.log(originalname)
const output = `/mnt/file/${filename}.pdf`;
const outputGray = `/mnt/file/${filename}-gray.pdf`;
const output1 = `/mnt/file/${filename}-1.pdf`;
const output2 = `/mnt/file/${filename}-2.pdf`;

let input = await req.file.path;
console.log(input)

if (req.body.grayPdf == "true") {
  //console.log("is gray pdf")
const grayPdfStatus =  await grayPdf(input, outputGray);
input = outputGray;
const fileStats = await fs.statSync(input);
    const fileSizeInKB = Math.ceil(fileStats.size / 1000)
    console.log(fileSizeInKB)
}


if (!req.body.pdfLimit) {

    const compressStatus = await compressPdf(input, output, 120);
    if (compressPdf) {
    res.json({url: `file/${filename}.pdf`})
    }
    if(!compressPdf) {
      res.json({status : 404, error: "Error occured during Compression"})
    }
} else {
  const fileLimit =  req.body.pdfLimit * 1000;
 console.log(fileLimit)

const compressStatus1 = await compressPdf(input, output1, 25)

const compressStatus2 = await compressPdf(input, output2, 50)


if (compressStatus2 && compressStatus1) {
  
 
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
   const dpi = (Math.ceil(Math.pow((fileLimit / b), (1 / a))) )
    console.log(dpi)
    const compressStatus = await compressPdf(input, output, dpi);
    if (compressPdf) {
   /* const fileStats = await fs.statSync(output);
    const fileSizeInBytes = fileStats.size;
    console.log(fileSizeInBytes)
    if (fileSizeInBytes < fileLimit) {
      res.json({url: `file/${filename}.pdf`})
    }else {
      
    }*/
    const fileStats = await fs.statSync(output);
    const fileSizeInKB = Math.ceil(fileStats.size / 1000)
    console.log(fileSizeInKB)
    res.json({
      url: `file/${filename}.pdf`,
      size: fileSizeInKB,
    })
    }
    if (!compressPdf) {
      res.json({status : 404, error: "Error occured during Compression"})
    }
}
      
  
    
  
  
  

}
}
   
});

async function compressPdf  (input, output, dpi) {
  try {
    await  exec(
      `gs \ -q -dNOPAUSE -dBATCH -dSAFER \ -sDEVICE=pdfwrite \ -dCompatibilityLevel=1.4 \ -dPDFSETTINGS=/ebook \ -dEmbedAllFonts=true \ -dSubsetFonts=true \ -dAutoRotatePages=/None \ -dDownsampleColorImages=true \ -dColorImageDownsampleType=/Bicubic \ -dColorImageResolution=${dpi} \ -dGrayImageDownsampleType=/Bicubic \ -dGrayImageResolution=${dpi} \ -dMonoImageDownsampleType=/Subsample \ -dMonoImageResolution=${dpi} \ -sOutputFile=${output} \ ${input}`)
        console.log("done")
        return true
  } catch (err) {
    console.log(err)
            return false
  }
}
  async function grayPdf  (input, output) {
  try {
    await  exec(
      `gs \
 -sOutputFile=${output} \
 -sDEVICE=pdfwrite \ -sColorConversionStrategy=Gray \ -dNOPAUSE \ -dBATCH \ ${input}`)
 console.log(input)
 console.log(output)
        console.log("gray done")
        return true
  } catch (err) {
    console.log(err)
            return false
  }
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
  
        


app.listen(5000,() => {
console.log("App is listening on Port 5000");
})