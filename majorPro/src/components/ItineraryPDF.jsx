import { Document, Page, Text, View} from "@react-pdf/renderer";

const ItineraryPDF = ({ planner }) => (
  <Document>
    <Page size="A4" style={{ padding: 24 }}>
      <Text style={{ fontSize: 30, marginBottom: 10, textAlign: "center", }}>
        Travel Itinerary
      </Text>

      {planner.map((day, i) => (
        <View key={i} style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 20 }}>{day.day}</Text>
          {day.activities.map((a, j) => (
            <Text key={j}>
              {a.time} - {a.text}
            </Text>
          ))}
        </View>
      ))}
    </Page>
  </Document>
);

export default ItineraryPDF
