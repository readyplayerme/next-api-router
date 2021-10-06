import { NextApiResponse } from "next";

export const mockResponse = (): NextApiResponse => {
  const sendOriginal = jest.fn();
  const response = {
    writableEnded: false,
    status: jest.fn(() => response),
    json: jest.fn((value: Record<string, any>) => {
      (response as any).writableEnded = true;
      response.send(value);
    }),
    send: sendOriginal,
    sendOriginal,
    statusCode: 200,
  } as unknown as NextApiResponse;

  return response;
};
