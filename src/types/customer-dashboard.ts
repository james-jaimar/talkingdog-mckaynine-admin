
export interface ClientWithDogs {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  dogs: {
    id: string;
    name: string;
    breed: string;
  }[];
  bookings: {
    id: string;
    class_schedule_id: string;
    dog_id: string;
    class_schedule: {
      id: string;
      start_time: string;
      class: {
        id: string;
        name: string;
        description: string;
      };
    };
  }[];
}
