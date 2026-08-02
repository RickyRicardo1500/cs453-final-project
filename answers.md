# Part 1 - Conceptual Foundations Answers

## 1. Authentication vs. Authorization

Authentication verifies the identity of a user, while authorization determines what an authenticated user is allowed to do. If a request does not contain valid authentication credentials, the API should return **401 Unauthorized** because the client has not successfully authenticated. If the caller is authenticated but does not have permission to perform the requested operation, the API should return **403 Forbidden** because the user is logged in but is not authorized to access that resource.

## 2. Passwords, Sessions, and Tokens

Applications should never store passwords as plain text because anyone who gains access to the database would immediately know every user's password. Instead, the server should store a secure password hash created with a hashing algorithm such as bcrypt. In a session-based login, the server stores session information and the client sends a session identifier with each request. In a token-based login, the server issues a signed token, such as a JWT, that the client includes with each request. An advantage of session-based authentication is that sessions can be revoked easily on the server. An advantage of token-based authentication is that it is stateless and works well for APIs and distributed systems.

## 3. JSON Web Tokens

A JSON Web Token (JWT) is used to securely transmit information about an authenticated user between a client and a server. A JWT consists of three parts: the header, the payload, and the signature. Signing a JWT ensures that its contents cannot be modified without detection, while encryption hides the contents from anyone who reads the token. A server must validate a JWT before trusting its claims by verifying the signature, expiration time, and other required fields. If JWTs have excessively long expiration times, a stolen token can be used by an attacker for an extended period before it expires.

## 4. OAuth

OAuth allows users to grant limited access to their resources without sharing their passwords. The resource owner is the user who owns the data. The client application is the third-party application requesting access. The authorization server authenticates the user and issues access tokens. The resource server hosts the protected resources and validates access tokens before providing access. The access token is the credential that allows the client to access protected resources. Providing an OAuth access token is safer than sharing a password because the token can have limited permissions, can expire, and can be revoked without changing the user's password.

## 5. PKI and Certificates

A digital certificate helps a client establish a secure connection by verifying the identity of the server. The server's private key is kept secret and is used during the TLS handshake, while the public key is included in the certificate and is shared with clients. A certificate authority (CA) verifies the server's identity and signs the certificate so clients can trust it. The client verifies that the certificate was signed by a trusted CA, matches the server's hostname, and has not expired. If certificate validation were skipped, attackers could perform man-in-the-middle attacks by presenting fake certificates and intercepting encrypted communications.

## 6. Databases, Messages, and Asynchronous Processing

When generating a report that may take several minutes, the API should use asynchronous processing instead of keeping the HTTP request open because long-running requests can time out and reduce server performance. A good design is to create a database record representing the report job, place a message on a queue, and have a background worker process the report. The API should immediately return **202 Accepted** with a job identifier, indicating that the request has been accepted for processing. The client can later check the report's progress by sending a request to a status endpoint, which should return **200 OK** along with the current job status, such as pending, processing, completed, or failed.
