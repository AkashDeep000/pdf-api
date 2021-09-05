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

//import multer from "multer"
import exec from "await-exec";
import fs from "fs-extra"
const host = process.env.HOST

import busboy from "connect-busboy";   // Middleware to handle the file upload https://github.com/mscdex/connect-busboy
 
app.use(busboy({
    highWaterMark: 0.5 * 1024 * 1024, // Set 0.5MiB buffer
})); // Insert the busboy middle-ware
 
const uploadPath = '/mnt/file/'; // Register the upload path
fs.ensureDir(uploadPath); // Make sure that he upload path exits
 
 
/**
 * Create route /upload which handles the post request
 */
 /*
app.route('/upload').post((req, res, next) => {
 
    req.pipe(req.busboy); // Pipe it trough busboy
 
    req.busboy.on('file', (pdfFile, file, filename) => {
        console.log(`Upload of '${filename}' started`);
 
        // Create a write stream of the new file
        const fstream = fs.createWriteStream(`${uploadPath}${filename}`);
        // Pipe it trough
        file.pipe(fstream);
 
        // On finish of the upload
        fstream.on('close', () => {
            console.log(`Upload of '${filename}' finished`);
            res.redirect('back');
        });
    });
});

*/

//const upload = multer({ dest: '/mnt/file/' })

app.use('/file/', express.static('/mnt/file'))

app.post('/upload', async (req, res, next) => {
   const apiTimeout = 10 * 60 * 1000;
  // Set the timeout for all HTTP requests
    req.setTimeout(apiTimeout, () => {
        let err = new Error('Request Timeout');
        err.status = 408;
        next(err);
    });
    // Set the server response timeout for all HTTP requests
    res.setTimeout(apiTimeout, () => {
        let err = new Error('Service Unavailable');
        err.status = 503;
        next(err);
    });
  
  
  req.pipe(req.busboy); 
  // Pipe it trough busboy
if (req.busboy) {
  let formData = new Map();
  req.busboy.on('field', function(fieldname, val) {
    formData.set(fieldname, val);
  });
  let filename;
 req.busboy.on('file', (pdfFile, file, filenameClient) => {
  
        console.log(`Upload of '${filenameClient}' started`);
         filename = `${filenameClient.slice(0, -4).replace(/\s+/g, '-').replace(/[{(&$@<>?!%#*^)}]/g, '_')}-${Date.now()}`;
        // Create a write stream of the new file
        const fstream = fs.createWriteStream(`${uploadPath}${filename}.pdf`);
        // Pipe it trough
        file.pipe(fstream);
 
        // On finish of the upload
fstream.on('close', () => {
  console.log(`Upload of '${filename}' finished`);
});
return true
});

req.busboy.on("finish", async () => {

    console.log(formData) // Map { 'name' => 'hi', 'number' => '4' }
    // here you can do 
    const pdfLimit = formData.get('pdfLimit') //  '600'
    const pdfGray = formData.get('pdfGray') //  'true'

    // any other logic with formData here

// console.log(req)
 function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
 }
 if (!pdfLimit) {
   res.writeHead(404)
   res.send("no limit set")
 }
 //has file and limit
 if (pdfLimit) {
   
   const input = `/mnt/file/${filename}.pdf`;
   
   const output = `/mnt/file/${filename}-out.pdf`;
   const output1 = `/mnt/file/${filename}-out1.pdf`;
   const output2 = `/mnt/file/${filename}-out2.pdf`;
   
   
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
const fileLimit = pdfLimit * 1024;
const a = getBaseLog((25 / 50), (fileStats1.size / fileStats2.size))
console.log(a)
const b = (fileStats1.size / Math.pow(25,a))
const dpi = Math.pow((fileLimit / b), (1 / a))
console.log(dpi)
//Compress In Calculated DPI
const compressStatus = await compressPdf(input, output, dpi, pdfGray);
const fileStats = await fs.statSync(output);
console.log("fileStats(Cal DPI)",fileStats.size/1000)
if ((pdfLimit - (fileStats.size/1000)) > 10) {
  const newDpi = dpi +1 ;
  const compressStatus = await compressPdf(input, output1, newDpi, pdfGray);
const fileStats = await fs.statSync(output1);
console.log("fileStats(Cal DPI Incr 1)",fileStats.size/1000)
if (pdfLimit > (fileStats.size/1000)) {
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
if ((pdfLimit - (fileStats.size/1000) < 10) && Math.sign(pdfLimit - (fileStats.size/1000)) == 1) {
  res.json({
    url: `${host}/file/${filename}.pdf`,
    size: (fileStats.size/1000).toFixed(2)
  })
  
}
if (pdfLimit < (fileStats.size/1000)) {
  const newDpi = dpi - 1 ;
  const compressStatus = await compressPdf(input, output1, newDpi, pdfGray);
const fileStats = await fs.statSync(output1);
console.log("fileStats(Cal DPI Decr 1)",fileStats.size/1000)
if (pdfLimit > (fileStats.size/1000)) {
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
            
            
  //finished          
});
        

  
}
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
    //    console.log("input",input)
    //    console.log("output",output)
    //  console.log("dpi",dpi)
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
