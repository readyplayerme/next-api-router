import { NextApiResponse } from "next";

export const mockResponse = (): NextApiResponse => {
  const response = {
    finished: false,
    status: jest.fn(() => response),
    json: jest.fn(() => {
      response.finished = true;
    }),
  } as unknown as NextApiResponse;

  return response;
};
