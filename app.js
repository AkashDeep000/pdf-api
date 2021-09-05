import dotenv from "dotenv";
dotenv.config()
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

const host = process.env.HOST


const upload = multer({ dest: '/mnt/file/' })

app.use('/file/', express.static('/mnt/file'))

app.post('/upload', upload.single('pdfFile'), async function (req, res, next) {
  
  req.socket.setTimeout(10 * 60 * 1000)
// console.log(req)
 function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
 }
 if (!req.file || !req.body.pdfLimit) {
   res.writeHead(404)
   res.end("No File Given!")
 }
 //has file and limit
 if (req.file && req.body.pdfLimit) {
   
   let input = await req.file.path;
   const pdfGray = req.body.pdfGray;
   const filename = `${req.file.originalname.slice(0, -4).replace(/\s+/g, '-').replace(/[{(&$@<>?!%#*^)}]/g, '_')}-output-${Date.now()}`;
   
   const output = `/mnt/file/${filename}.pdf`;
   const output1 = `/mnt/file/${filename}1.pdf`;
   const output2 = `/mnt/file/${filename}2.pdf`;
   
   
//compress into Tow dpi to find perfect dpi
const compressStatus1 = await compressPdf(input, output1, 25, pdfGray);
const compressStatus2 = await compressPdf(input, output2, 50, pdfGray);
//await Promise.all([compressStatus1, compressStatus2]);
//Calculating Size of Compressed Pdf
const fileStats1 = fs.statSync(output1);
const fileStats2 = fs.statSync(output2);
await Promise.all([fileStats1,fileStats2])
console.log("fileStats1(25DPI)",(fileStats1.size/1000))
console.log("fileStats2(50DPI)",(fileStats2.size/1000))
//Calculating DPI
const fileLimit = req.body.pdfLimit * 1024;
const a = getBaseLog((25 / 50), (fileStats1.size / fileStats2.size))
console.log(a)
const b = (fileStats1.size / Math.pow(25,a))
const dpi = Math.pow((fileLimit / b), (1 / a))
console.log(dpi)
//Compress In Calculated DPI
const compressStatus = await compressPdf(input, output, dpi, pdfGray);
const fileStats = await fs.statSync(output);
console.log("fileStats(Cal DPI)",fileStats.size/1000)
if ((req.body.pdfLimit - (fileStats.size/1000)) > 10) {
  const newDpi = dpi +1 ;
  const compressStatus = await compressPdf(input, output1, newDpi, pdfGray);
const fileStats = await fs.statSync(output1);
console.log("fileStats(Cal DPI Incr 1)",fileStats.size/1000)
if (req.body.pdfLimit > (fileStats.size/1000)) {
  res.json({
    url: `${host}/file/${filename}1.pdf`,
    size: (fileStats.size/1000).toFixed(2)
  })
}else{
  res.json({
    url: `${host}/file/${filename}.pdf`,
    size: (fileStats.size/1000).toFixed(2)
  })
}
}
if ((req.body.pdfLimit - (fileStats.size/1000) < 10) && Math.sign(req.body.pdfLimit - (fileStats.size/1000)) == 1) {
  res.json({
    url: `${host}/file/${filename}.pdf`,
    size: (fileStats.size/1000).toFixed(2)
  })
  
}
if (req.body.pdfLimit < (fileStats.size/1000)) {
  const newDpi = dpi - 1 ;
  const compressStatus = await compressPdf(input, output1, newDpi, pdfGray);
const fileStats = await fs.statSync(output1);
console.log("fileStats(Cal DPI Decr 1)",fileStats.size/1000)
if (req.body.pdfLimit > (fileStats.size/1000)) {
  res.json({
    url: `${host}/file/${filename}1.pdf`,
    size: (fileStats.size/1000).toFixed(2)
  })
}else{
  const newDpi = dpi - 2 ;
  const compressStatus = await compressPdf(input, output2, newDpi, pdfGray);
const fileStats = await fs.statSync(output2);
console.log("fileStats(Cal DPI Decr 2)",fileStats.size/1000)
  res.json({
    url: `${host}/file/${filename}2.pdf`,
    size: (fileStats.size/1000).toFixed(2)
  })
}
}

 }
 //has file and limit End
})

app.listen(5000,() => {
console.log("App is listening on Port 5000");
})


async function compressPdf  (input, output, dpiFr, pdfGray) {
  console.log(pdfGray)
  if (pdfGray == "true") {
      try {
        console.log("in gray")
        const dpi = Math.floor(dpiFr)
    await  exec(
      `convert -density ${dpi} ${input} -depth 8 -type bilevel ${output}`)
        console.log(`Compressed ✓ (${dpi})dpi`)
        console.log(`Output: (${output})`)
        return true
  } catch (err) {
    console.log(err)
            return false
  }
  }else{
      try {
        const dpi = Math.ceil(dpiFr)
    await  exec(
      `gs \ -q -dNOPAUSE -dBATCH -dSAFER \ -sDEVICE=pdfwrite \ -dCompatibilityLevel=1.4 \ -dPDFSETTINGS=/ebook \ -dEmbedAllFonts=true \ -dSubsetFonts=true \ -dAutoRotatePages=/None \ -dNOCIE \ -dNOPSICC \ -dColorAccuracy=0 \ -dDownsampleColorImages=true \ -dColorImageDownsampleType=/Bicubic \ -dColorImageResolution=${dpi} \ -dGrayImageDownsampleType=/Bicubic \ -dGrayImageResolution=${dpi} \ -dMonoImageDownsampleType=/Subsample \ -dMonoImageResolution=${dpi} \ -sOutputFile=${output} \ ${input}`)
        console.log(`Compressed ✓ (${dpi})dpi`)
        console.log(`Output: (${output})`)
        return true
  } catch (err) {
    console.log(err)
            return false
  }
  }

}
