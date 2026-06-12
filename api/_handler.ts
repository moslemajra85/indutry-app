import serverless from "serverless-http";
import { createApp } from "../src/app";

const handler = serverless(createApp());

export default handler;
