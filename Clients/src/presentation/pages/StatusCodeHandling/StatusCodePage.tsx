import React from 'react';
import { STATUS_CODES } from './statusCodes';

interface StatusCodePageProps {
  /** 
   * The HTTP status code to display.
   * @type {number}
   */
  code: number;
}

/**
 * StatusCodePage Component
 * 
 * Displays the HTTP status code and its corresponding message based on the `STATUS_CODES` mapping.
 * 
 * @param {StatusCodePageProps} props - The properties for the StatusCodePage component.
 * @param {number} props.code - The status code to look up and display.
 * @returns {JSX.Element} The rendered component showing the status code and message, or an error if the code is invalid.
 */
const StatusCodePage: React.FC<StatusCodePageProps> = ({ code }) => {
  // Retrieve the status function from STATUS_CODES based on the provided code
  const status = STATUS_CODES[code];
  
  if (!status) {
    // Render an error message if the status code is invalid
    return <div>Error: Invalid status code</div>;
  }

  // Call the status function to get the message
  const { message } = status(null); // No specific data or error provided, defaulting to `null`
  
  return (
    <div>
      <h1>Status Code: {code}</h1>
      <p>Message: {message}</p>
    </div>
  );
};

export default StatusCodePage;
