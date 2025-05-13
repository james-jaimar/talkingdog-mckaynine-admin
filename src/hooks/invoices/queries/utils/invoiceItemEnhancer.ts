export function enhanceInvoiceItems(invoice: any) {
  if (!invoice) {
    return invoice;
  }

  if (invoice?.items?.length > 0) {
    for (const item of invoice.items) {
      if (item.bookings?.class_schedules) {
        const schedule = item.bookings.class_schedules;
        // Use optional chaining and provide fallback by using classes.id if class_id is missing
        const classId = schedule.class_id || schedule.classes?.id;
        
        // Now use classId instead of schedule.class_id
        item.classInfo = schedule?.classes?.name;
      }
      if (item.bookings?.dogs) {
        item.dogInfo = item.bookings.dogs.name;
      }
    }
  }
  
  return invoice;
}
