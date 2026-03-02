import { Resend } from "resend";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || "";
export const FROM = process.env.RESEND_FROM || "ProblemRadar <hello@problemradar.com>";
