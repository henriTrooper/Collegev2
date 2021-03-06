
module.exports = {
  summary: 'FindBYCriteria a collegien',
  description: 'collegien FindBYCriteria',
  tags: ['collegien'],
  requestBody: {
    description: 'Answers to previous questions',
    required: true,
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Collegien',
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Next questions',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Collegien',
          },
        },
      },
    },
    default: {
      $ref: '#/components/responses/Error',
    },
  },
};
