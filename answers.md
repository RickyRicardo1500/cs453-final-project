# Part 1 - Conceptual Foundations Answers

## 1. Authentication vs. Authorization

Authentication verifies the identity of a user while authorization determines what an authenticated user is allowed to do. If a request does not contain valid authentication credentials, then the API should return 401 Unauthorized because the client has not successfully been authenticated. If the caller is authenticated, but does not have permission to perform the requested operation, then the API should return 403 Forbidden. This is because the user is logged in, but is not authorized to access that resource.

## 2. Passwords, Sessions, and Tokens

Applications should never store passwords as plain text because anyone who gains access to the database would know every user's password. The server should instead store a secure password hash created with a hashing algorithm, such as bcrypt. In a session-based login, the server stores session information and the client sends a session identifier with each request. In a token-based login, the server issues a signed token that the client includes with each request. An advantage of session-based authentication is that sessions can be revoked easily on the server. An advantage of token-based authentication is that it is stateless and works well for APIs and distributed systems.

## 3. JSON Web Tokens

A JSON Web Token (JWT) is used to securely transmit information about an authenticated user between the client and the server. A JWT consists of the header, the payload, and the signature. Signing a JWT ensures that its contents cannot be modified without detection, while encryption hides the contents from anyone who reads the token. A server must validate a JWT before trusting its claims by verifying the signature, expiration time, and other required fields. If JWTs have excessively long expiration times, a stolen token can be used by an attacker for an extended period before it expires.

## 4. OAuth

OAuth allows users to grant limited access to their resources without sharing their passwords. The resource owner is the user who owns the data. The client application is the third party application requesting access. The authorization server authenticates the user and issues access tokens. The resource server hosts the protected resources and validates access tokens before providing access. The access token is the credential that allows the client to access protected resources. Providing an OAuth access token is safer than sharing a password because the token can have limited permissions, can expire, and can be revoked without changing the user's password.

## 5. PKI and Certificates

A digital certificate helps a client establish a secure connection by verifying the identity of the server. The server's private key is kept secret and is used during the TLS handshake, while the public key is included in the certificate and is shared with clients. A certificate authority verifies the server's identity and signs the certificate so clients can trust it. The client verifies that the certificate was signed by a trusted certificate authority, matches the server's hostname, and has not expired. If certificate validation were skipped, attackers could perform attacks by presenting fake certificates and intercepting encrypted communications.

## 6. Databases, Messages, and Asynchronous Processing

When generating a report that may take several minutes, the API should use asynchronous processing instead of keeping the HTTP request open because long-running requests can time out and reduce server performance. A good design is to create a database record representing the report job, place a message on a queue, and have a background worker process the report. The API should immediately return 202 Accepted with a job identifier, indicating that the request has been accepted for processing. The client can later check the report's progress by sending a request to a status endpoint, which should return 200 OK along with the current job status, such as pending, processing, completed, or failed.

# Part 2 - Secure API Design Answers

## 1. Authentication and Authorization
Request                                                  | Decision and Status Code
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|                           
| A request contains no access token                     | Reject with 401 Unauthorized because the API cannot verify the caller’s identity.                                |
| A request contains an expired JWT                      | Reject with 401 Unauthorized because the token is no longer valid.                                               |
| A student requests one of their own tasks              | Allow with 200 OK, assuming the task exists.                                                                     |
| A student requests another student’s task              | Reject with 403 Forbidden because the student is authenticated but does not have permission to access that task. |
| An instructor requests a task belonging to any student | Allow with 200 OK, assuming the task exists, because instructors may access any task.                            |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|


Authentication ends after the API verifies the JWT signature, expiration, issuer, and other required claims, and then identifies the caller and their role. Authorization begins after that identity is trusted. The API then compares the authenticated user’s role and identity with the requested resource. For example, a student may access a task only when the task’s studentId matches the user identity in the JWT, while an instructor may access tasks belonging to any student.

If the JWT is missing, expired, or invalid, the request fails during authentication with 401 Unauthorized. If the JWT is valid but the authenticated user is not permitted to access the requested task, the request fails during authorization with 403 Forbidden.

## 2. Authentication and Authorization

## 2. OAuth, JWT, and PKI Design

The university’s OAuth authorization server should issue the access token after the user successfully logs in. The token should be a signed JWT containing trusted claims such as the user’s identity, role, issuer, audience, and expiration time.The client should send the JWT to the Course Task Tracker API in the HTTP Authorization header. Before trusting the token, the API must verify its digital signature using the university authorization server’s public key. It should also validate the token’s expiration time, issuer, audience, and required claims. Only after these checks succeed should the API use the identity and role contained in the JWT.

HTTPS protects the connection between the client and the API by encrypting the request and response in transit. During the TLS handshake, the API presents a digital certificate containing its public key. The client verifies that the certificate was issued by a trusted certificate authority, matches the API’s hostname, and has not expired. This helps prevent attackers from impersonating the API or intercepting the access token. The API must not trust a role supplied in the request body because the client controls that data and could submit "role": "instructor" to gain unauthorized access. The API should use only the role from the validated JWT or another trusted server side data source.

## 3. Database and Asynchronous Report Processing

A client should request a new progress report with POST /reports. The API should identify the student from the validated JWT and create a database record like:

```json
{
  "id": "report-2",
  "studentId": "djs001",
  "status": "pending",
  "downloadUrl": null
}
```

After creating the record, the API should place a message on the queue containing the information needed by the worker:

```json
{
  "reportId": "report-2",
  "studentId": "djs001"
}
```

The API must not wait for the report to finish. It should immediately return 202 Accepted with a response like:

```json
{
  "id": "report-2",
  "status": "pending"
}
```

The client can check the current status with GET /reports/{id}. A successful status request should return 200 OK and the current database record. When the background worker receives the queue message, it should first update the job status from "pending" to "processing". If report generation succeeds, the worker should update the record to "completed" and store the generated file’s URL:

```json
{
  "id": "report-2",
  "studentId": "djs001",
  "status": "completed",
  "downloadUrl": "https://api.example.edu/reports/report-2.pdf"
}
```

If report generation fails, the worker should update the job status to "failed". The system may also store an error message for logging or troubleshooting, but it should avoid exposing sensitive internal details to the client. This design allows the original HTTP request to finish immediately while the report is generated independently in the background.

# Part 3 - Authentication and Authorization Implementation Answers

## 4. Error Classification

Situation                                                                   | Status Code
|-----------------------------------------------------------------------------------------------|                           
| No access token was provided                                              | 401 Unauthorized  |
| The JWT has expired                                                       | 401 Unauthorized  |
| The JWT signature is invalid                                              | 401 Unauthorized  |
| A validly authenticated student attempts an instructor-only operation     | 403 Forbidden     |
|-----------------------------------------------------------------------------------------------|

A 401 Unauthorized response is used when the API cannot authenticate the caller because the access token is missing, expired, or has an invalid signature. In these cases, the server cannot trust the user's identity.

A 403 Forbidden response is used when the caller has already been authenticated successfully but does not have permission to perform the requested operation. An example would be a student with a valid JWT who attempts an instructor only operation should receive 403 Forbidden because the identity is known, but the user's role does not grant access.

# Part 4 - Database Integration and Async/Await Answers

## 2. Database and Asynchronous Behavior

1. The task ID should be supplied as a query parameter because parameterized queries protect the application from SQL injection attacks and ensure the value is treated as data rather than executable SQL. Parameterized queries also improve reliability by allowing the database to safely handle input values.

2. The route must use await because db.query() is an asynchronous operation that returns a sort of Promise. Using await pauses the route until the database query completes, allowing the server to use the query results or handle any errors before sending the HTTP response.

# Part 5 - Message Queues and Background Processing Answers

## 3. Queue Behavior

The API returns 202 Accepted because the report is not finished when the request is received. The request has been accepted for processing, but the report will be generated later by a background worker rather than immediately, so 200 OK or 201 Created would not accurately describe the operation. One advantage of using a background worker is that it allows the API to respond immediately without keeping the HTTP request open for several minutes so it avoids request timeouts and lets the server continue handling other client requests while the report is being generated.

# Part 7 - Reflection Answers

# Answers

## 1. Following a Request Through the System

One protected API operation is GET /tasks/:id. The client first sends an HTTP request with an Authorization: Bearer token header. Express routing matches the request to the correct route handler. Authentication middleware verifies the JWT and identifies the user. Authorization then checks whether the user is allowed to access the requested task, such as verifying that the user owns the task or has an instructor or administrator role. If authorization succeeds, the server queries the database to retrieve the task. Finally, the server sends an HTTP response containing the task data with a 200 OK status. If an error occurs, the API returns a JSON error response with the appropriate status code. The OpenAPI documentation describes the route, required parameters, authentication requirements, and expected responses so clients know how to use the endpoint correctly.

One place where the request could fail is during authentication. If the JWT is missing, invalid, or expired, the authentication middleware should stop processing the request and return 401 Unauthorized with a JSON error message indicating that authentication is required.


## 2. Synchronous vs. Asynchronous Processing

An operation such as retrieving a task by its ID should be handled synchronously because it is a quick database query and the client expects an immediate response. The client receives the requested task with a 200 OK response. If the task does not exist, the API returns 404 Not Found. The database stores the task data that is returned to the client.

Generating a large report is better handled asynchronously using a message queue and a background worker because the operation may take several minutes to complete. The API creates a database record for the report request, places a message on the queue, and immediately returns 202 Accepted with a job ID. The background worker processes the report and updates the database with the job's status, such as pending, processing, completed, or failed. The client can later request the job status, which returns 200 OK along with the current status or a download link when the report is finished.

## 3. Lessons Learned

The first practice I would recommend is designing the database before writing the API. A good designed database with proper primary keys and foreign keys helps maintain data integrity and makes implementing relationships between users, projects, and tasks much easier.

The second practice is to use secure authentication and authorization. Passwords should always be hashed with a secure algorithm such as bcrypt, and JWTs should be validated on every protected request. Authorization checks should verify that users have permission to access or modify resources. These practices help prevent unauthorized access and protect sensitive data.

The third practice is to use asynchronous processing for long executing operations. Instead of keeping an HTTP request open while a report is generated, the server should use a message queue and a background worker. This improves scalability, avoids request timeouts, and allows the client to check the job status while processing continues in the background.

