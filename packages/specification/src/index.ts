export interface Model {
  name: string;
}

export interface Models {
  type: 'success';
  models: Model[];
}

export interface BackupAPI {
  '/health': {
    GET: {
      //
    },
  };

  '/models': {
    GET: {
      response: Models | Error,
    },
  };

}
