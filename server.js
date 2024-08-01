const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const multer = require('multer');
const fs = require('fs');
const csvParser = require('csv-parser');
const fastcsv = require('fast-csv');
const { Readable } = require('stream');
const cookieParser = require('cookie-parser');


const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true } // Set to true if using HTTPS
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));



const config = {
  user: 'PritpalAdmin',
  password: 'Pritpal@123',
  server: 'dbverifyamritmalwa.database.windows.net',
  database: 'NOC_Details',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectionTimeout: 50000,
    requestTimeout: 50000  
  }
};


// Declare a global variable
let globalVariable = 'Initial Value';

// Access and modify the global variable
app.get('/check-variable', (req, res) => {
    res.send(`The current value of the global variable is: ${globalVariable}`);
});

app.post('/update-variable', (req, res) => {
    const { newValue } = req.body;
    globalVariable = newValue;
    res.send(`Global variable updated to: ${globalVariable}`);
});

let clientConnected = false;

app.get('/ping', (req, res) => {
    clientConnected = true;
    res.sendStatus(200);
});

// Check for disconnection every minute
setInterval(() => {
    if (!clientConnected) {
        console.log('No clients connected. Shutting down server.');
        globalVariable = 'false'; // disable access to its contents
    }
    clientConnected = false; // Reset flag for next check
}, 600000); // Check every 600 seconds

// Serve login page

// Middleware to check if user is authenticated
// Handle login form submission
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('Received username:', username);
  console.log('Received password:', password);

  try {
      await sql.connect(config);
      const result = await sql.query`
          SELECT * FROM login WHERE login_id = ${username} AND password = ${password}
      `;

      if (result.recordset.length > 0) {
          console.log('Login successful for username:', username);
          globalVariable = 'true';
          console.log('Session data set:', req.session.user);
          res.json({ status: 'success', message: 'Login successful' });
      } else {
          console.log('Login failed for username:', username);
          globalVariable = 'false';
          res.json({ status: 'failure', message: 'Invalid username or password' });
      }
  } catch (err) {
      console.error('POST /login - Error', err.message);
      globalVariable = 'false';
      res.status(500).send('Internal Server Error');
  }
});

function isAuthenticated(req, res, next) {
  if (globalVariable === 'true') {
      console.log('Authorization status: Authorized');
      next();
  } else {
      console.log('Authorization status: Unauthorized');
      res.status(401).send('Unauthorized');
  }
}



app.get('/api/data', async (req, res) => {
  try {
    const query = (req.query.q || '').toLowerCase();
    const status = req.query.status || '';

    await sql.connect(config);
    let result;

    if (query && status==='BranchDetails') {
      queryString = 'SELECT TOP 20 * FROM Branch WHERE ';

      if (query) {
        queryString += `  (
          LOWER([branch_name]) LIKE '%' + '${query}' + '%' OR 
          LOWER([state]) LIKE '%' + '${query}' + '%' OR 
          LOWER([city]) LIKE '%' + '${query}' + '%' OR 
          LOWER([branch_address]) LIKE '%' + '${query}' + '%' OR
          LOWER([contact_no]) LIKE '%' + '${query}' + '%'
        )`;
      }


      console.log('Executing query:', queryString);  // Log the query string

      result = await sql.query(queryString);
    } 
    else if (query && status==='UserDetails') {
      queryString = 'SELECT TOP 20 * FROM login WHERE ';

      if (query) {
        queryString += `  (
          LOWER([name]) LIKE '%' + '${query}' + '%' OR 
          LOWER([mobile_no]) LIKE '%' + '${query}' + '%' OR 
          LOWER([user_type]) LIKE '%' + '${query}' + '%' OR 
          LOWER([login_id]) LIKE '%' + '${query}' + '%' OR
          LOWER([password]) LIKE '%' + '${query}' + '%' OR
          LOWER([branches_visible]) LIKE '%' + '${query}' + '%' 
        )`;
      }


      console.log('Executing query:', queryString);  // Log the query string

      result = await sql.query(queryString);
    } 


    else if (status === 'BranchDetails') {
      result = await sql.query`
        SELECT TOP 10 
          id,
          branch_name,
          state,
          city,
          branch_address,
          contact_no
        FROM Branch`;
    } else if (status === 'UserDetails') {
      result = await sql.query`
        SELECT TOP 10 
          id,
          name, 
          mobile_no, 
          user_type, 
          login_id, 
          password, 
          branches_visible 
        FROM login`;
    }
    else if (query && status) {
      queryString = 'SELECT TOP 20 * FROM Loan_Number2 WHERE ';

      if (query) {
        queryString += `  (
          LOWER([Loan No]) LIKE '%' + '${query}' + '%' OR 
          LOWER([Status]) LIKE '%' + '${query}' + '%' OR 
          LOWER([Father Name]) LIKE '%' + '${query}' + '%' OR 
          LOWER([Source Name]) LIKE '%' + '${query}' + '%' OR 
          LOWER([Branch]) LIKE '%' + '${query}' + '%' OR
          LOWER([Name]) LIKE '%' + '${query}' + '%' OR
          LOWER([Customer Address]) LIKE '%' + '${query}' + '%'
        )`;
      }

      if (status) {
        queryString += ` AND Status = '${status}'`;
      }

      console.log('Executing query:', queryString);  // Log the query string

      result = await sql.query(queryString);
    } else if (query) {
      queryString = 'SELECT TOP 20 * FROM Loan_Number2 WHERE ';

        queryString += `  (
          LOWER([Loan No]) LIKE '%' + '${query}' + '%' OR 
          LOWER([Status]) LIKE '%' + '${query}' + '%' OR 
          LOWER([Father Name]) LIKE '%' + '${query}' + '%' OR 
          LOWER([Source Name]) LIKE '%' + '${query}' + '%' OR 
          LOWER([Branch]) LIKE '%' + '${query}' + '%' OR
          LOWER([Name]) LIKE '%' + '${query}' + '%' OR
          LOWER([Customer Address]) LIKE '%' + '${query}' + '%'
        )`;
      

      console.log('Executing query:', queryString);  // Log the query string

      result = await sql.query(queryString);
    } else if (status) {
      result = await sql.query`SELECT TOP 40 * FROM Loan_Number2 WHERE Status = ${status}`;
    } else {
      result = await sql.query`SELECT TOP 40 * FROM Loan_Number2`;
    }

    res.json(result.recordset);
  } catch (err) {
    console.error('GET /api/data - Error', err.message);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/api/tabname', (req, res) => {
  const { tabName } = req.body;
  console.log('POST /api/tabname', { tabName });
  res.sendStatus(200);
});

app.post('/api/action', async (req, res) => {
  const { action, agreementNo } = req.body;
  
  let status;
  if (action === 'Accept') {
    status = 'Accepted';
  } else if (action === 'Reject') {
    status = 'Rejected';
  } else if (action === 'Completed') {
    status = 'Completed';
  } else if (action === 'Posted') {
    status = 'Posted';
  } else {
    status = 'Unknown';
  }

  console.log('POST /api/action', { action: status, agreementNo });
if (status=='Accepted')
{
  try {
    await sql.connect(config);
    await sql.query`UPDATE Loan_Number2 SET Status = ${status},
     Remarks= '', [Date of NOC Accepted Rejected]=DATEADD(MINUTE, 330, GETUTCDATE())  WHERE [Loan No] = ${agreementNo}`;
    res.sendStatus(200);
  } catch (err) {
    console.error('POST /api/action - Error', err.message);
    res.status(500).send('Internal Server Error');
  }
}
if (status=='Rejected')
  {
    try {
      await sql.connect(config);
      await sql.query`UPDATE Loan_Number2 SET Status = ${status},
       [Date of NOC Accepted Rejected]=DATEADD(MINUTE, 330, GETUTCDATE())  WHERE [Loan No] = ${agreementNo}`;
      res.sendStatus(200);
    } catch (err) {
      console.error('POST /api/action - Error', err.message);
      res.status(500).send('Internal Server Error');
    }
  }
  if (status=='Completed')
    {
      try {
        await sql.connect(config);
        await sql.query`UPDATE Loan_Number2 SET Status = ${status},
         Remarks= '',[Date of NOC Issued] = DATEADD(MINUTE, 330, GETUTCDATE())  WHERE [Loan No] = ${agreementNo}`;
        res.sendStatus(200);
      } catch (err) {
        console.error('POST /api/action - Error', err.message);
        res.status(500).send('Internal Server Error');
      }
    }
else{
  try {
    await sql.connect(config);
    await sql.query`UPDATE Loan_Number2 SET Status = ${status},
    Remarks='' WHERE [Loan No] = ${agreementNo}`;
    res.sendStatus(200);
  } catch (err) {
    console.error('POST /api/action - Error', err.message);
    res.status(500).send('Internal Server Error');
  }}
});

// API Endpoint to Add a New User
app.post('/api/userdetails', async (req, res) => {
  const { name, mobile_no, user_type, login_id, password, branches_visible } = req.body;

  console.log('Received data:', { name, mobile_no, user_type, login_id, password, branches_visible });

  // Validate input
  if (!name || !mobile_no || !user_type || !login_id || !password || !branches_visible) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const request = new sql.Request();
    await request.query(`
      INSERT INTO login (name, mobile_no, user_type, login_id, password, branches_visible)
      VALUES ('${name}', '${mobile_no}', '${user_type}', '${login_id}', '${password}', '${branches_visible}')
    `);

    res.status(201).json({ message: 'User details added successfully' });
  } catch (err) {
    console.error('Error inserting user details:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/api/branchdetails', async (req, res) => {
  const { branch_name, state, city, branch_address, contact_no } = req.body;

  console.log('Received data:', { branch_name, state, city, branch_address, contact_no });

  // Validate input
  if (!branch_name || !state || !city || !branch_address || !contact_no ) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const request = new sql.Request();
    await request.query(`
      INSERT INTO Branch (branch_name, state, city, branch_address, contact_no)
      VALUES ('${branch_name}', '${state}', '${city}', '${branch_address}', '${contact_no}')
    `);

    res.status(201).json({ message: 'Branch details added successfully' });
  } catch (err) {
    console.error('Error inserting branch details:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//

app.post('/api/login',async (req, res) => {
  const { login_id, password } = req.body;
  console.log('Received data:', { login_id, password });

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('login_id', sql.NVarChar, login_id)
      .input('password', sql.NVarChar, password)
      .query('SELECT branches_visible FROM login WHERE login_id = @login_id AND password = @password');

    if (result.recordset.length > 0) {
      console.log('Success'); // Log "Success" to the terminal
      const branchesVisible = result.recordset[0].branches_visible;
      globalVariable = 'true';
      res.status(200).json({ success: true, branches_visible: branchesVisible });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error:', error); // Log error details for debugging
    res.status(500).json({ success: false, message: 'Server error' });
  }
});




app.get('/api/generate-report', async (req, res) => {
  try {
    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query
    const result = await pool.request().query(`
      SELECT TOP 500 event_time, server_instance_name, database_name, server_principal_name, client_ip, statement, succeeded, action_id, class_type, additional_information
      FROM sys.fn_get_audit_file('https://noclog.blob.core.windows.net/sqldbauditlogs/dbverifyamritmalwa/NOC_Details/SqlDbAuditing_Audit_NoRetention/2024-07-23/07_20_40_259_0.xel', default, default)
      WHERE (event_time <= '2024-07-23T07:23:15.692Z')
      ORDER BY event_time DESC
    `);

    // Convert the result to CSV
    const data = result.recordset;
    const csvStream = fastcsv.format({ headers: true });
    const readableStream = Readable.from(data);

    // Set headers for the CSV response
    res.setHeader('Content-disposition', 'attachment; filename=report.csv');
    res.setHeader('Content-type', 'text/csv');

    // Pipe the CSV stream to the response
    readableStream.pipe(csvStream).pipe(res);
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).send('Error generating report');
  }
});

app.get('/api/report', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM Loan_Number2`;

    const data = result.recordset;
    const csvStream = fastcsv.format({ headers: true });
    const writableStream = fs.createWriteStream('report.csv');

    writableStream.on('finish', () => {
      res.download('report.csv');
    });

    csvStream.pipe(writableStream);
    data.forEach(row => {
      csvStream.write(row);
    });
    csvStream.end();
  } catch (err) {
    console.error('GET /api/report - Error', err.message);
    res.status(500).send('Internal Server Error');
  }
});






const upload = multer({ dest: 'uploads/' });

app.post('/api/upload-csv', upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  const tableName = 'Test3'; // Specify the table name

  try {
    await sql.connect(config);

    const data = [];
    fs.createReadStream(file.path)
      .pipe(csvParser())
      .on('data', row => data.push(row))
      .on('end', async () => {
        if (data.length > 0) {
          const columns = Object.keys(data[0]);

          const checkTableQuery = `IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}')
                                   BEGIN
                                     DROP TABLE ${tableName}
                                   END`;
          await sql.query(checkTableQuery);

          const createTableQuery = `CREATE TABLE ${tableName} (${columns.map(col => `[${col}] VARCHAR(MAX)`).join(', ')})`;
          await sql.query(createTableQuery);

          const batchSize = 1000; 
          for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            const values = batch.map(row => `(${columns.map(col => `'${row[col].replace(/'/g, "''")}'`).join(', ')})`).join(', ');
            const columnsQuoted = columns.map(col => `[${col}]`).join(', ');
            const insertQuery = `INSERT INTO ${tableName} (${columnsQuoted}) VALUES ${values}`;

            await sql.query(insertQuery);
          }

          const mergeQuery = `
            INSERT INTO [dbo].[Loan_Number2] (
  [Loan No],
  [Status],
  [Name],
  [Father Name],
  [Branch],
  [Source Name],
  [Customer Address],
  [Customer Number],
  [Co-Lender],
  [Last Reciept Amt.],
  [Last Reciept date],
  [Reason for NOC],
  [Customer Mobile No],
  [Dealer Mobile No],
  [Date of NOC Applied],
  [Date of NOC Accepted/Rejected],
  [Date of NOC Issued],
  [Remarks]
)
SELECT
  t3.[Loan No],
  t3.[Status],
  t3.[Name],
  t3.[Father Name],
  t3.[Branch],
  t3.[Source Name],
  t3.[Customer Address],
  t3.[Customer Number],
  t3.[Co-Lender],
  t3.[Last Reciept Amt.],
  t3.[Last Reciept date],
  t3.[Reason for NOC],
  t3.[Customer Mobile No],
  t3.[Dealer Mobile No],
  t3.[Date of NOC Applied],
  t3.[Date of NOC Accepted/Rejected],
  t3.[Date of NOC Issued],
  t3.[Remarks]
FROM
  [dbo].[Test3] t3
WHERE
  NOT EXISTS (
    SELECT 1
    FROM [dbo].[Loan_Number2] ln
    WHERE ln.[Loan No] = t3.[Loan No]
  ); `;

          await sql.query(mergeQuery);

          const cleanupQuery = `
            DELETE FROM [dbo].[Loan_Number2]
WHERE
  [Loan No] IS NULL OR [Loan No] = '' AND
  [Status] IS NULL OR [Status] = '' AND
  [Name] IS NULL OR [Name] = '' AND
  [Father Name] IS NULL OR [Father Name] = '' AND
  [Branch] IS NULL OR [Branch] = '' AND
  [Source Name] IS NULL OR [Source Name] = '' AND
  [Customer Address] IS NULL OR [Customer Address] = '' AND
  [Customer Number] IS NULL OR [Customer Number] = '' AND
  [Co-Lender] IS NULL OR [Co-Lender] = '' AND
  [Last Reciept Amt.] IS NULL OR [Last Reciept Amt.] = '' AND
  [Last Reciept date] IS NULL OR [Last Reciept date] = '' AND
  [Reason for NOC] IS NULL OR [Reason for NOC] = '' AND
  [Customer Mobile No] IS NULL OR [Customer Mobile No] = '' AND
  [Dealer Mobile No] IS NULL OR [Dealer Mobile No] = '' AND
  [Date of NOC Applied] IS NULL OR [Date of NOC Applied] = '' AND
  [Date of NOC Accepted/Rejected] IS NULL OR [Date of NOC Accepted/Rejected] = '' AND
  [Date of NOC Issued] IS NULL OR [Date of NOC Issued] = '' AND
  [Remarks] IS NULL OR [Remarks] = '';

          `;
          await sql.query(cleanupQuery);

          res.sendStatus(200);
        } else {
          res.status(400).send('No data found in the uploaded CSV.');
        }
      });
  } catch (err) {
    console.error('POST /api/upload-csv - Error', err.message);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/delete-completed', async (req, res) => {
  try {
    await sql.connect(config);
    await sql.query`DELETE FROM Loan_Number2 WHERE Status = 'Completed'`;
    res.sendStatus(200);
  } catch (err) {
    console.error('POST /api/delete-completed - Error', err.message);
    res.status(500).send('Internal Server Error');
  }
});












app.post('/api/editBranch', async (req, res) => {
  const { id, branch_name, state, city, branch_address, contact_no } = req.body;

  try {
    await sql.connect(config);
    await sql.query`
      UPDATE Branch
      SET branch_name = ${branch_name}, state = ${state}, city = ${city}, branch_address = ${branch_address}, contact_no = ${contact_no}
      WHERE id = ${id}
    `;
    res.status(200).send('Branch details updated successfully');
  } catch (err) {
    console.error('Error updating branch details:', err);
    res.status(500).send('Internal Server Error');
  }
});
app.post('/api/editUser', async (req, res) => {
  const { id, name, mobile_no, user_type, login_id, password, branches_visible } = req.body;

  try {
    await sql.connect(config);
    await sql.query`
      UPDATE login
      SET name = ${name}, mobile_no = ${mobile_no}, user_type = ${user_type}, login_id = ${login_id}, password = ${password}, branches_visible = ${branches_visible}
      WHERE id = ${id}
    `;
    res.status(200).send('User details updated successfully');
  } catch (err) {
    console.error('Error updating user details:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/api/deleteUser/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await sql.connect(config);
    await sql.query`DELETE FROM login WHERE id = ${id}`;
    res.status(200).send('User deleted successfully');
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).send('Internal Server Error');
  }
});
app.delete('/api/deleteBranch/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await sql.connect(config);
    await sql.query`DELETE FROM Branch WHERE id = ${id}`;
    res.status(200).send('Branch deleted successfully');
  } catch (err) {
    console.error('Error deleting Branch:', err);
    res.status(500).send('Internal Server Error');
  }
});















app.post('/api/updateRemarks', async (req, res) => {
  const { agreementNo, remarks } = req.body;

  // Prepare the SQL query
  const query = `
    UPDATE Loan_Number2
    SET Remarks = '${remarks}',
        Status = 'Rejected',
        [Date of NOC Accepted Rejected]=DATEADD(MINUTE, 330, GETUTCDATE()) 
    WHERE [Loan No] = '${agreementNo}'
  `;

  try {
    // Log the query and parameters to the terminal
    console.log('Executing query:', query);
    console.log('With parameters:', { agreementNo, remarks });

    await sql.connect(config);
    await sql.query`
    UPDATE Loan_Number2
    SET Remarks = ${remarks},
        Status = 'Rejected'
    WHERE [Loan No] = ${agreementNo}
  `;
    res.status(200).send('User details updated successfully');
  } catch (error) {
    console.error('Error updating remarks:', error);
    res.sendStatus(500);
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Set the destination folder for uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp to avoid file name conflicts
  }
});

const upload2 = multer({ 
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDFs are allowed'), false);
    }
  }
});


app.post('/api/uploadFile', upload.single('file'), async (req, res) => {
  const { id } = req.body;
  const file = req.file;

  if (!file || !id) {
    return res.status(400).send('File or ID not provided');
  }

  // Assuming you have a SQL connection pool set up
  const pool = await sql.connect(config);

  try {
    const fileData = fs.readFileSync(file.path);
    const result = await pool.request()
      .input('FileName', sql.NVarChar, file.originalname)
      .input('FileData', sql.VarBinary, fileData)
      .input('Id', sql.NVarChar, id)
      .query('UPDATE Loan_Number2 SET FileName = @FileName, FileType = @FileData WHERE [Loan No] = @Id');
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Server error');
  } finally {
    fs.unlinkSync(file.path); // Clean up temp file
  }
});

app.get('/api/downloadFile/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send('ID not provided');
  }

  const pool = await sql.connect(config);

  try {
    const result = await pool.request()
      .input('Id', sql.NVarChar, id) // Ensure this matches the type used in your database
      .query('SELECT FileName, FileType FROM Loan_Number2 WHERE [Loan No] = @Id');

    if (result.recordset.length === 0) {
      return res.status(404).send('File not found');
    }

    const file = result.recordset[0];
    
    // Set headers for file download as a PDF
    res.setHeader('Content-Disposition', `attachment; filename=${file.FileName}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(file.FileType);  // Send the file data as a response
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).send('Server error');
  }
});



app.post('/api/get-info', async (req, res) => {
  const { agreementNo } = req.body;
  console.log('Received data:', { agreementNo });

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('agreementNo', sql.NVarChar, agreementNo)
      .query('SELECT Status, [Loan No], Branch, [Name], [Father Name], [Source Name], [Customer Address], [Customer Number],[FileName] FROM Loan_Number2 where [Loan No]=@agreementNo'); // Adjust column name if necessary

    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset[0]); // Send the first matching record
    } else {
      res.status(404).json({ message: 'No record found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
app.post('/api/updateCoLender', async (req, res) => {
  const { agreementNo, coLender } = req.body;

  if (!agreementNo || !coLender) {
    return res.status(400).send('Agreement number or Co-Lender not provided');
  }

  // Assuming you have a SQL connection pool set up
  const pool = await sql.connect(config);

  try {
    await pool.request()
      .input('CoLender', sql.NVarChar, coLender)
      .input('AgreementNo', sql.NVarChar, agreementNo) // Updated to NVarChar if the column name contains spaces
      .query(`
        UPDATE Loan_Number2 
        SET [Co Lender] = @CoLender, Status = 'Accepted',[Date of NOC Accepted Rejected]=DATEADD(MINUTE, 330, GETUTCDATE()) 
        WHERE [Loan No] = @AgreementNo
      `);
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Error updating co-lender:', error);
    res.status(500).send('Server error');
  }
});
app.post('/api/apply-noc', async (req, res) => {
  const { agreementNo, LastReceiptAmt, LastReceiptDate, ReasonForNoc, CustomerMobileNo, DealerMobileNo } = req.body;

  // Check if all required fields are provided and validate the mobile numbers
  const isCustomerMobileValid = CustomerMobileNo === '' || /^[0-9]{10}$/.test(CustomerMobileNo);
  const isDealerMobileValid = DealerMobileNo === '' || /^[0-9]{10}$/.test(DealerMobileNo);

  if (!agreementNo || !LastReceiptAmt || !LastReceiptDate || !ReasonForNoc || (!isCustomerMobileValid && !isDealerMobileValid)) {
    return res.status(400).json({ success: false, message: 'All fields are required and mobile numbers must be 10 digits.' });
  }

  // Set empty strings to NULL
  const customerMobile = CustomerMobileNo === '' ? null : `'${CustomerMobileNo}'`;
  const dealerMobile = DealerMobileNo === '' ? null : `'${DealerMobileNo}'`;

  try {
    // Connect to the database
    await sql.connect(config);

    // Update data in Loan_Number2 table
    await sql.query(`
      UPDATE Loan_Number2
      SET
        Status = 'Applied',
        [Last Reciept Amt] = '${LastReceiptAmt}',
        [Last Reciept date] = '${LastReceiptDate}',
        [Reason for Noc] = '${ReasonForNoc}',
        [Customer Mobile No] = ${customerMobile},
        [Dealer Mobile No] = ${dealerMobile},
        [Date of NOC Applied] = DATEADD(MINUTE, 330, GETUTCDATE())
      WHERE [Loan No] = '${agreementNo}';
    `);

    res.status(200).json({ success: true, message: 'NOC application successfully updated.' });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  } finally {
    // Close the database connection
    await sql.close();
  }
});



app.get('/api/download-file', async (req, res) => {
  const { fileName, loanNo } = req.query;

  if (!fileName || !loanNo) {
    return res.status(400).send('Missing fileName or loanNo');
  }

  try {
    // Connect to the database
    await sql.connect(config);

    // Query the database to get the file data
    const result = await sql.query`
      SELECT FileData
      FROM Loan_Number2
      WHERE FileName = ${fileName} AND [Loan No] = ${loanNo}
    `;

    if (result.recordset.length > 0) {
      const file = result.recordset[0];
      const fileData = file.FileData; // Binary data of the file

      // Set the response headers to force download as PDF
      res.setHeader('Content-Disposition', `attachment; filename=${fileName.replace(/\.[^/.]+$/, '')}.pdf`);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(fileData);
    } else {
      res.status(404).send('File not found');
    }
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).send('Error fetching file');
  }
});



app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
