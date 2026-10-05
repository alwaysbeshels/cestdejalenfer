window.TRANSLATIONS = window.TRANSLATIONS || {};
window.TRANSLATIONS.en = {
  "marathon.impact": "Road segment closed in the direction indicated by the supplied Waze export.",
  "marathon.direction": "Waze segment direction: from node {from} to node {to}. Compass direction not published.",
  "marathon.geometry": "Segment geometry from the supplied Waze export, not from the official leaflet. Coordinate order follows the reported closure direction.",
  "marathon.scope": "Supplied community export with no explicit extraction date or time zone. Event and pedestrian-access coverage is incomplete.",
  "marathon.segment": "Waze segment",
  "marathon.provenance": "Export provenance",
  "marathon.status": "Status in the export",
  "marathon.eventStatus": "Event flags in the export",
  "marathon.nodeRestriction": "Published node restriction",
  "marathon.loadError": "Marathon closures could not be loaded. Other available sources remain displayed.",
  "marathon.pdfImpact": "Street closed during the time window in the official leaflet.",
  "marathon.pathImpact": "Path sections occupied by the race during the leaflet's time window. This does not mean the entire park or garden is closed.",
  "marathon.pathName": "Course paths",
  "marathon.pdfGeometry": "RTRT course coordinates matched to the PDF's timed sections. Only verified portions are drawn; ambiguous transitions are left unmapped. Race direction does not establish vehicle traffic direction.",
  "marathon.pdfScope": "Leaflet times in Montreal local time, not race start times. Waze export times may differ; the two sources remain separate.",
  "marathon.courses": "Associated races",
  "marathon.pdfReference": "PDF: page / table row",
  "marathon.geometrySource": "Course geometry source",
  "language.name": "English",
  "language.switch": "FR",
  "language.switchLabel": "Switch to French",
  "document.mapTitle": "Road restrictions map - Greater Montreal",
  "document.faqTitle": "Frequently asked questions | Road restrictions map",
  "nav.main": "Main navigation",
  "nav.map": "Map",
  "nav.auto": "Driving",
  "nav.pedestrian": "Walking",
  "nav.potholes": "Potholes",
  "nav.mapMode": "Travel mode",
  "potholes.documentTitle": "Potholes - Montreal",
  "potholes.region": "City of Montreal",
  "potholes.title": "Potholes",
  "potholes.howTitle": "How it works",
  "potholes.statisticsTitle": "Statistics",
  "potholes.howDocumentTitle": "How it works | Potholes and patching",
  "potholes.statisticsDocumentTitle": "Statistics | Potholes and patching",
  "potholes.statisticsSummaryDocumentTitle": "Overview | Statistics | Potholes and patching",
  "potholes.statisticsChartsDocumentTitle": "Charts | Statistics | Potholes and patching",
  "potholes.statisticsBoroughsDocumentTitle": "By borough | Statistics | Potholes and patching",
  "potholes.howHeading": "Understanding the data and statuses",
  "potholes.howLead": "This section brings together citizen requests and patching records published by the City of Montreal. It helps interpret their history but does not replace a road inspection. A 311 request, a public location and a physical pothole are not the same thing.",
  "potholes.howFactSources": "Official source data",
  "potholes.howFactSourcesDetail": "311 requests and mechanical patching records, retained in dated copies of the data.",
  "potholes.howFactLocations": "Approximate locations",
  "potholes.howFactLocationsDetail": "311 coordinates are relocated to a street segment; several potholes may share a point.",
  "potholes.howFactStatuses": "Estimated statuses",
  "potholes.howFactStatusesDetail": "Our colours represent a chronological rule, not City confirmation.",
  "potholes.howContents": "Explanation contents",
  "potholes.howSourcesHeading": "Sources and collection",
  "potholes.howLocationsHeading": "Reports and locations",
  "potholes.howStatusesHeading": "311 and map statuses",
  "potholes.howHistoryHeading": "History and reactivation",
  "potholes.howRepairsHeading": "Patching data",
  "potholes.howLimitsHeading": "Interpretation and limitations",
  "potholes.howRadius": "Maximum distance used to find patching near a reported location: {radius} metres.",
  "potholes.how.q.report": "How can I report a pothole?",
  "potholes.how.a.report": "For now, I do not have a form for receiving your potholes directly and adding them to my map. In Montreal, you can report them to the City through its online form, the 311 Montréal app or by calling 311.",
  "potholes.how.reportOnline": "Report a pothole on Montreal's website",
  "potholes.how.reportApp": "Download the 311 Montréal app",
  "potholes.how.reportPhone": "Call 311 (from outside Montreal: 514 872-0311)",
  "potholes.how.reportDelay": "A report to the City does not appear here immediately: it must be published in the open data and then included in an update of this map. Call 311 for a hazard requiring immediate attention. For a highway or access ramp, contact 511.",
  "potholes.how.q.sources": "Where does the data come from?",
  "potholes.how.a.sources": "We use two Montreal open datasets: citizen service requests (311), restricted to the Nid-de-poule category, and mechanical pothole patching work. The first describes requests; the second publishes machine GPS records. Our grouping and statuses are calculated locally and are not official statuses from those sources.",
  "potholes.how.q.collection": "How does the data reach the map?",
  "potholes.how.a.collection": "<p>A collection tool queries configured open-data resources by year and result pages. It normalizes 311 requests while retaining published fields: dates, status, street, borough and location. Patching records come from CSV or GeoPackage resources; coordinates are converted to latitude/longitude where needed.</p><p>Annual files are then compiled into a location index and nearby patching history. Coordinates clearly incompatible with the region are excluded from the map. Your browser reads these data files; it does not contact 311 whenever the map moves. The 2016 request archive, duplicated across two source resources, is imported only once.</p>",
  "potholes.how.q.freshness": "Is this a real-time map?",
  "potholes.how.a.freshness": "<p>No. The 311 source advertises daily updates, while patching is published in annual files. Our copy changes only after collection runs and the resulting files are published. Opening or refreshing the page does not trigger that collection.</p><p>The verification date records when our sources were checked, not when each pothole was inspected or each repair performed. A data file's update date changes only when its contents change. Rebuilding the map locally does not make its data newer. Historical years are generally reloaded when lightweight checks detect a change; those checks are not an exhaustive rereading of every field on every run.</p>",
  "potholes.how.q.scope": "Does this cover all of Greater Montreal?",
  "potholes.how.a.scope": "<p>No. This section uses Montreal resources, not an exhaustive pothole inventory for the entire region. Related-city names may occur in records without guaranteeing complete coverage of those areas. Data from the Driving and Walking maps is not added as pothole reports.</p><p>Coordinate validation uses a plausibility envelope around Montreal, not an exact administrative boundary. An empty area may simply be absent from the sources we use.</p>",
  "potholes.how.q.request": "Does one report represent one pothole?",
  "potholes.how.a.request": "<p>Not necessarily. It is a 311 entry in the Nid-de-poule category: a request, complaint or comment, according to its published type. Several requests may concern the same problem, and a request may describe several potholes.</p><p>Information-only requests are counted in the raw dataset but do not become pothole points. Request counts must not be presented as a count of physical potholes.</p>",
  "potholes.how.q.location": "Why is the point not exactly on the pothole?",
  "potholes.how.a.location": "<p>The City obscures precise 311 request locations by relocating coordinates to the midpoint of the nearest eligible street segment longer than 45 metres. We retain that public location rather than inventing a more precise address.</p><p>Requests sharing the exact same coordinate are grouped. That location may represent several potholes or separate deterioration episodes on a segment. It cannot establish a side of the street, a lane or a unique hole.</p>",
  "potholes.how.q.excluded": "Why are some records not mapped?",
  "potholes.how.a.excluded": "<p>An information request without a location, missing or inconsistent coordinates, or a fallback point at a borough office cannot locate a pothole. Such requests are not drawn as potholes. Our current generator considers none of the locations in the 2014–2016 request files usable.</p><p>Exclusion from the map does not delete a request from its annual data file. This is why a source total can exceed the number of mappable requests.</p>",
  "potholes.how.q.clusters": "What do clusters and locations count?",
  "potholes.how.a.clusters": "<p>A cluster number counts distinct public locations, not 311 requests. A cluster of five locations can represent far more than five reports. At closer zoom levels, each point retains its own current status.</p><p>A cluster may contain several statuses; its neutral styling does not create a fourth point status. View totals count the represented clusters and points, including clusters extending partly beyond the visible edge.</p>",
  "potholes.how.q.cityStatus": "What does a 311 request status mean?",
  "potholes.how.a.cityStatus": "<p>It describes administrative processing. Acceptée, Prise en charge, Transmise pour traitement, Réactivée and Urgente are grouped as open requests in our files. Terminée, Annulée, Refusée and Supprimée are grouped as closed requests. Missing or unrecognized statuses remain unknown.</p><p><strong>A closed request is not proof of a repair.</strong> Cancellation, refusal or deletion do not confirm patching; even Terminée does not, by itself, supply a geolocated intervention linked to this pothole. We retain the published status in the details, separately from the map status.</p>",
  "potholes.how.q.whyStatuses": "Why create our own statuses?",
  "potholes.how.a.whyStatuses": "<p>Automatically colouring every completed 311 request as repaired would be misleading. Instead, we compare reports with known mechanical interventions while keeping that assessment separate from administrative processing.</p><p>Our statuses answer a narrower question: given the available history at this location, is there a known patching record after its latest report? They are <strong>explicit estimates</strong>, not municipal decisions, predictions or on-site findings.</p>",
  "potholes.how.q.ourStatuses": "How are Active, Presumed repaired and Unknown status calculated?",
  "potholes.how.status.active": "No patching record within 25 m is strictly later than the latest known report, or a new report has arrived since patching. This is our rule's default state, not confirmation that a pothole remains on the road.",
  "potholes.how.status.repaired": "Patching was recorded within 25 m after the latest report, with no subsequent request at that public location. This does not confirm a repair of that specific pothole.",
  "potholes.how.status.unknown": "The latest report date does not support a usable chronology. Missing recent patching data does not, by itself, produce this status: without a known later intervention, our rule leaves the point Active.",
  "potholes.how.a.oneStatus": "A location has one current status. Past repairs are not additional statuses. Colours use the entire available history even when an earlier year is selected. A report and patching record with the same timestamp are not enough to presume a repair.",
  "potholes.how.q.matching": "How is patching associated with a report?",
  "potholes.how.a.matching": "The map looks for patching GPS records near the published 311 location, after its first report. The maximum distance is shown below. Records with identical date, machine and coordinates are counted only once in the history. There is no official link between the request and this work: nearby patching may concern another pothole or the opposite side of the street. A repair is presumed, never confirmed for that specific pothole.",
  "potholes.how.q.radius": "Why 25 metres instead of 10 metres?",
  "potholes.how.a.radius": "<p>The 25 m radius is a technical choice for this map, not guaranteed accuracy or a City-validated threshold. A public 311 location is shifted to the midpoint of a street segment longer than 45 m, so it may not be within 10 m of the actual pothole. Patching vehicle GPS can also be off by a few metres, or tens of metres near tall buildings.</p><p>Using 10 m is technically possible and would retain fewer neighbouring repairs, but it could also miss more work genuinely connected to a report. At 25 m, the opposite can happen: work on a different pothole may be included. Neither 10 m nor 25 m confirms a repair of the reported pothole with these data alone. Choosing a better threshold would require comparison with verified repairs on the ground.</p>",
  "potholes.how.q.reactivated": "Why is a point active when its history contains several patching records?",
  "potholes.how.a.reactivated": "Status depends on the most recent event, not the cumulative number of repairs. A report after the latest nearby patching starts a new estimated active episode. It may be recurring damage or another pothole sharing the public location. These data alone cannot distinguish them.",
  "potholes.how.exampleLabel": "Illustrative example, not actual records",
  "potholes.how.exampleFirstDate": "January 10, 2025",
  "potholes.how.exampleFirst": "A report is received",
  "potholes.how.exampleFirstState": "Estimated state: Active",
  "potholes.how.exampleRepairDate": "January 15, 2025",
  "potholes.how.exampleRepair": "Nearby patching is recorded",
  "potholes.how.exampleRepairState": "Estimated state: Presumed repaired",
  "potholes.how.exampleLastDate": "March 2, 2025",
  "potholes.how.exampleLast": "A new report is received",
  "potholes.how.exampleLastState": "Current estimated state: Active, despite past patching",
  "potholes.how.q.disagreement": "Why can a completed request be red, or an open request grey?",
  "potholes.how.a.disagreement": "<p>They answer different questions. 311 gives a request's processing status; our colour compares the dates of reports and nearby patching records.</p><p>A completed request with no known later patching can remain Active. Conversely, an in-progress request may be at a Presumed repaired location if a later intervention is known. Neither indicator replaces the other.</p>",
  "potholes.how.q.years": "What does the Year filter mean in Potholes mode?",
  "potholes.how.a.years": "<p>It selects locations with an estimated active period during the chosen year. A report opens that period, the next nearby patching closes it, and a subsequent request reopens it. Without a known end, the period continues into later years, even without new reports.</p><p>A year entirely between repair and reactivation is excluded. However, a point's colour remains its <strong>current status in the dataset</strong>, not a reconstruction of its state at the end of that year. A location appears only once even when several years are selected.</p>",
  "potholes.how.q.historyCount": "Why do details include reports from earlier years?",
  "potholes.how.a.historyCount": "<p>Details retain the complete location history, while the Year filter selects active periods. The total since the first report is therefore not an annual count. Searching for one request number can select a single request while the hover label still shows a larger historical total.</p><p>Patching since the first report counts nearby records associated with that location. It does not prove that each request received a separate repair or that every intervention concerned the same pothole. Neighbouring public locations can also share an intervention within their respective radii.</p>",
  "potholes.how.q.delay": "Is the displayed delay the time taken to repair the pothole?",
  "potholes.how.a.delay": "No. Time to the latest status is the interval between request creation and its latest administrative status date. That status may still be open or may have changed for another reason. It is neither a certified repair-time measurement nor a promise of future work.",
  "potholes.how.q.currentYear": "Why is the current year missing from Patching?",
  "potholes.how.a.currentYear": "<p>Patching data is distributed in annual files, not as a complete real-time feed. Our tool currently uses resources for 2016–2025. A new year requires identifying and adding the relevant resource, then collecting, validating and publishing its data.</p><p><strong>No 2026 file in our data does not prove that no work occurred in 2026 or that no newer publication exists elsewhere.</strong> We do not invent an empty year from that absence. The statistical overview and Patching mode show the periods actually available.</p>",
  "potholes.how.q.repairRecord": "Does a patching point mean one pothole was repaired?",
  "potholes.how.a.repairRecord": "<p>The source contains a GPS position, date and mechanical patching machine. Several interventions may share a coordinate. A point is not a certified count of unique potholes, and manual repairs are outside this dataset.</p><p>The data file supplies no repaired street segment, start/end limits or street name for each record. Connecting the points would imply that an entire stretch was treated. We therefore retain the points and their published attributes.</p>",
  "potholes.how.q.partial": "Why does a patching year cover only a few months?",
  "potholes.how.q.manualRepairs": "Where are the repairs done by hand?",
  "potholes.how.a.manualRepairs": "<p>The source publishes GPS positions from the central service's mechanical equipment. Its documentation excludes manual repairs and borough interventions. These are not records removed by our map.</p><p>In the Montreal and Données Québec catalogues consulted, we did not find an open dataset giving the locations and dates of manual pothole repairs in Montreal. This does not mean the work did not happen or that the City lacks internal records. A completed 311 request or an aggregate total does not provide evidence of a geolocated repair. The next step is to request those data from the City.</p>",
  "potholes.how.requestManualData": "Contact Montreal's open-data team",
  "potholes.how.a.partial": "<p>An annual filename does not guarantee twelve months of coverage. Some files contain partial periods, and a few dates can belong to a different year from the filename. Patching's Year filter chooses the source file; its Month filter follows the dates actually present.</p><p>The first and last displayed dates are observed bounds, not a guarantee of continuous records in between. An absent month does not necessarily mean that no crews worked.</p>",
  "potholes.how.q.coordinates2021": "Why does the 2021 patching file display no points?",
  "potholes.how.a.coordinates2021": "<p>In the current dataset, all 50,320 interventions listed for 2021 have coordinates incompatible with Montreal. They are excluded from the map and matching instead of being arbitrarily relocated. The original file's coordinate system still needs verification before correcting the conversion.</p><p>The interventions remain in the source data file, with a warning in the interface. This gap makes history incomplete: it does not prove those repairs never occurred and can leave locations classified Active without usable patching evidence.</p>",
  "potholes.how.q.statistics": "Can these figures compare years or rank boroughs?",
  "potholes.how.a.statistics": "<p>Only with caution. 311 requests also reflect service usage, reporting habits and archive coverage. Patching covers only one repair method, and published periods vary. A partial year is not directly comparable with a full year.</p><p>The tables distinguish problem reports from information requests by creation year. Patching interventions have their own table. These are neither road-quality rankings nor repair rates. Requests without mappable coordinates remain counted in their category, and several reports may concern the same location.</p>",
  "potholes.how.q.absence": "Can the absence of a point or patching record prove anything?",
  "potholes.how.a.absence": "<p>No. A pothole may not have been reported, a request may lack usable coordinates, and manual repairs may not appear in the patching dataset. Delayed publication or coordinate conversion problems can also hide an intervention.</p><p>Conversely, a nearby record can be associated with the wrong pothole. Our statuses can therefore include false active locations and incorrect presumed repairs. This map alone cannot confirm actual road conditions.</p>",
  "potholes.how.q.planning": "Can the map give the next repair date, severity or danger level?",
  "potholes.how.a.planning": "No. The fields used do not provide future repair schedules or reliable depth, size or risk measurements for each pothole. Request volume is not a severity scale. A colour, recurrence or past patching record cannot predict an intervention date.",
  "potholes.how.q.independent": "Is this an official City service?",
  "potholes.how.a.independent": "No. The original data is official, but this section's compilation, grouping and estimated statuses are independent. This FAQ describes our current method. Municipal services remain the reference for administrative request follow-up and on-site conditions; this map is not a way to submit a 311 report.",
  "potholes.statisticsHeading": "Available data overview",
  "potholes.statisticsNavigation": "Statistics views",
  "potholes.tableAll": "All",
  "potholes.tableFilter": "Filter: {column}",
  "potholes.tableSortAscending": "Sort {column} in ascending order",
  "potholes.tableSortDescending": "Sort {column} in descending order",
  "potholes.tableSortReset": "Restore the original order of {column}",
  "potholes.statisticsSummaryTab": "Overview",
  "potholes.statisticsChartsTab": "Charts",
  "potholes.statisticsBoroughsTab": "Boroughs",
  "potholes.boroughsHeading": "Borough profile",
  "potholes.boroughsLead": "Reports, persistent locations and presumed patching in the selected area. Recorded mechanical patching does not represent all repairs carried out by the borough.",
  "potholes.boroughSelectedHeading": "Profile of {name}",
  "potholes.boroughsLoadError": "This borough's profile could not be loaded or no longer matches the published data. Another area's figures are not shown in its place.",
  "potholes.boroughReportCount": "Reports received",
  "potholes.boroughLocationsCount": "Distinct reported locations",
  "potholes.boroughPersistent": "Reported in multiple years",
  "potholes.boroughReturnsCount": "Reported again after presumed patching",
  "potholes.boroughWithoutPatch": "Repeated requests without recorded patching",
  "potholes.boroughTrendTitle": "Reports in this borough",
  "potholes.boroughPersistenceTitle": "Do the same locations keep returning?",
  "potholes.boroughPersistenceNote": "Distinct years with at least one report at the same location. A published location may represent several potholes.",
  "potholes.boroughReturnsNote": "{count} locations reported again out of {total} with twelve complete months of follow-up after a first eligible presumed patch. {excluded} more recent cases excluded. This is not a repair failure rate.",
  "potholes.boroughComparisonTitle": "Persistence compared with the rest of Montreal",
  "potholes.boroughComparisonNote": "Share of locations reported in at least two years. The rest of Montreal excludes the selected borough and uncertain assignments. This is not a performance measure.",
  "potholes.boroughRestOfCity": "Rest of Montreal",
  "potholes.boroughCoverage": "{missing} reports are included in the total but have no uniquely attributable location in this profile. {streets} locations have no sufficiently certain street assignment. Mechanical patching data through {end}; manual repairs and borough interventions are absent from the source.",
  "potholes.boroughSearchLabel": "Street or location",
  "potholes.boroughSearchPlaceholder": "Find a street or intersection",
  "potholes.boroughStreetsHeading": "Streets and repeated requests",
  "potholes.boroughStreetsNote": "Reliable locations assigned to a single street. Requests without coordinates and ambiguous matches are not included in this table.",
  "potholes.boroughLocationsHeading": "Locations to examine",
  "potholes.boroughLocationFilterLabel": "Location type",
  "potholes.boroughFilterPersistent": "Reported in multiple years",
  "potholes.boroughFilterUnpatched": "Without recorded patching",
  "potholes.boroughFilterReturns": "Reported after patching",
  "potholes.boroughFilterAll": "All locations",
  "potholes.boroughLocationsNote": "Reports and dates within the selected period. Nearby patching counted from the earliest known report through {end}. 'Without recorded patching' requires at least two requests within the patching coverage period; it does not prove that no repair took place.",
  "potholes.boroughYears": "Years reported",
  "potholes.boroughLastReport": "Last report",
  "potholes.boroughNoPatch": "None recorded",
  "potholes.boroughLatestPatch": "Latest: {date}",
  "potholes.boroughViewMap": "View on map",
  "potholes.boroughViewLocation": "View {place} on the map",
  "potholes.boroughPagination": "{first}–{last} of {total}",
  "potholes.boroughStreetsPages": "Street pages",
  "potholes.boroughLocationsPages": "Location pages",
  "potholes.chartsHeading": "Potholes in the data",
  "potholes.chartsLead": "Data published by the City of Montreal only: it does not cover the whole island or Greater Montreal. The patching shown is exclusively mechanized. We have no manual patching data in this source, which also excludes borough interventions.",
  "potholes.chartsPeriod": "Study period",
  "potholes.chartsRecentPeriod": "{first}–{last}",
  "potholes.chartsAllPeriod": "{first}–{last}",
  "potholes.chartsReportsUpdated": "311 updated: {date}",
  "potholes.chartsRepairsUpdated": "Patching updated: {date}",
  "potholes.chartsSources": "Sources: Montreal 311 requests through {reports}, mechanical patching through {repairs}. Information requests excluded.",
  "potholes.chartsFigures": "Additional information",
  "potholes.chartsUnavailableValue": "Unavailable",
  "potholes.chartsNoData": "The available data does not support this comparison.",
  "potholes.chartsLoadError": "Analyses could not be loaded or no longer match the published sources.",
  "potholes.chartsRefreshError": "Refresh unavailable. The last received data remains displayed.",
  "potholes.chartsLibraryError": "Charts could not be loaded. Figures remain available in the tables below.",
  "potholes.chartTrendTitle": "Are reports increasing?",
  "potholes.chartTrendStatement": "reports recorded in {year}, through {date}.",
  "potholes.chartTrendNoComparison": "The change cannot be calculated for this period.",
  "potholes.chartTrendNote": "All available reports from each year are included. {year} is still partial; previous years are not cut off at the same date.",
  "potholes.chartPersistenceTitle": "Locations reported year after year",
  "potholes.chartPersistenceStatement": "{count} of {total} locations have reports in at least two different years.",
  "potholes.chartPersistenceNote": "A published location may represent several potholes. {excluded} reports without usable locations are excluded from this calculation.",
  "potholes.chartOneYear": "One year only",
  "potholes.chartTwoYears": "Two years",
  "potholes.chartThreeYears": "Three years",
  "potholes.chartFourYears": "Four years",
  "potholes.chartFiveYears": "Five or more years",
  "potholes.chartReportedYears": "Years with reports",
  "potholes.chartConcentrationTitle": "How many reports per location?",
  "potholes.chartConcentrationStatement": "The most reported group averages {main} requests per location, compared with {other} for the remaining locations.",
  "potholes.chartConcentrationNote": "The most reported 10% of locations are compared with the remaining 90%. These are specific points, not 10% of streets. The ratio shows where requests accumulate, not pothole severity.",
  "potholes.chartTimes": "{value} times",
  "potholes.chartReportsPerLocation": "Reports per location",
  "potholes.chartAnnualChange": "Annual change",
  "potholes.chartPartialYear": "Partial year, not comparable",
  "potholes.chartTopTen": "Most reported 10%",
  "potholes.chartOtherLocations": "Other locations",
  "potholes.chartAllReports": "Geolocated reports",
  "potholes.chartGroup": "Group",
  "potholes.chartShare": "Share",
  "potholes.chartReturnsTitle": "New reports after patching",
  "potholes.chartReturnsStatement": "{count} of {total} locations have another report within twelve months of their first eligible presumed patching intervention.",
  "potholes.chartReturnsNote": "One reference intervention per location, with twelve complete months of follow-up. {excluded} more recent cases excluded. This does not measure failed repairs or prove the same pothole returned.",
  "potholes.chartReportedAgain": "Reported again",
  "potholes.chartNoNewReport": "No new report observed",
  "potholes.chartAfterPatching": "Within the next twelve months",
  "potholes.chartUnpatchedTitle": "Repeated requests without recorded patching",
  "potholes.chartUnpatchedStatement": "locations received at least two reports, totalling {count} requests within the covered period.",
  "potholes.chartUnpatchedNote": "Reports repeat at the same location without a mechanical patching intervention documented in our data since its earliest known report, even before the selected period. This does not prove that no manual repair, temporary repair or workaround occurred outside the source's coverage.",
  "potholes.chartTwoReports": "2 reports",
  "potholes.chartThreeReports": "3 reports",
  "potholes.chartFourReports": "4 reports",
  "potholes.chartFivePlusReports": "5 or more reports",
  "potholes.chartPolarLegend": "{group}: {count} locations",
  "potholes.chartPolarLegendTitle": "Reports: locations",
  "potholes.chartPolarLegendCompact": "{group}: {count}",
  "potholes.chartDistrictsTitle": "Where are the same locations reported in multiple years?",
  "potholes.chartDistrictsStatement": "Overall, {count} of {total} locations assigned to a borough were reported in at least two different years.",
  "potholes.chartDistrictsNote": "Each bar shows the share of that borough's locations reported in multiple years. For example, 40% means 40 out of 100 locations, not 40% of all Montreal potholes. {excluded} locations without a single recognized borough are excluded. This is not a repair rate.",
  "potholes.chartDistrictTooltip": "{count} out of {total} locations reported in multiple years",
  "potholes.chartRecurring": "Reported in multiple years",
  "potholes.statisticsLead": "311 problem reports and information requests are counted separately. Several reports may concern the same location: these are not counts of distinct potholes. Patching interventions are presented separately.",
  "potholes.statisticsCalculationNote": "Figures are calculated automatically from the site's data files, not entered manually in the HTML. They change after new data is collected and published, not in real time from the City. Map filters do not apply to this overview.",
  "potholes.statisticsLoadError": "The statistical overview could not be loaded. No substitute values are displayed.",
  "potholes.statisticsLatestReports": "311 problem reports in {year}",
  "potholes.statisticsLatestInformation": "311 information requests in {year}",
  "potholes.statisticsInformation": "Information requests",
  "potholes.statisticsReportsTotal": "Recorded 311 problem reports, all years: {count}",
  "potholes.statisticsRepairsTotal": "Recorded patching interventions, all files: {count}",
  "potholes.statisticsReportsHeading": "311 requests by creation year",
  "potholes.statisticsReportsNote": "Information requests are counted separately from problem reports.",
  "potholes.statisticsYear": "Creation year",
  "potholes.statisticsRequests": "311 problem reports",
  "potholes.statisticsRepairsHeading": "Mechanical patching by annual file",
  "potholes.statisticsRepairsNote": "Mechanical patching only; manual repairs excluded. Periods may be partial, and 2021 coordinates are unusable.",
  "potholes.statisticsFirstDate": "First published date",
  "potholes.statisticsLastDate": "Last published date",
  "potholes.rankingsHeading": "Locations, streets and patching machines",
  "potholes.rankingsLimits": "A published location may group several potholes. Patching recorded within 25 m does not confirm a repair of the reported pothole. Reappearances and missing patching records are estimates, not on-site findings. Manual repairs are not covered. Sorting and filters apply only to each table's rows, without recalculating overall totals.",
  "potholes.rankingsCoverage": "Recorded patching from {first} to {last}. Comparisons with reports use this same period.",
  "potholes.rankingsMethod": "Scope and method",
  "potholes.rankingsGeography": "Assignment to a single street within {radius} m: {matched} interventions retained, {ambiguous} ambiguous cases and {excluded} unassignable records, including {unidentified} without a confirmed road name or number. {duplicates} duplicates removed. Proximity is not an official link to a 311 request.",
  "potholes.rankingsLocationsCoverage": "Street rankings: {matched} assigned locations, {excluded} unassigned, including {unidentified} without a confirmed road name or number. Information requests and reports without reliable coordinates are not included.",
  "potholes.rankingsGeobase": "Current street reference retrieved on {date}. Historical streets may have changed names or alignments. Local street names, including East and West directions, remain distinct.",
  "potholes.rankingsRtss": "MTMD road network retrieved on {date}: {identified} of {total} generically named segments matched to a route number using their alignment and orientation. Identified highways are grouped by number. The {remaining} unresolved segments are never merged under a generic name; their interventions remain in overall totals without being assigned to a neighbouring street.",
  "potholes.rankingsMachinesMethod": "Machine identifiers are kept as published, without merging possible identifier changes. Device totals count every record, including unusable GPS positions. Absence from the latest partial file does not prove non-use.",
  "potholes.rankingsUnavailable": "Rankings are unavailable or no longer match the annual data. The summaries above remain available.",
  "potholes.rankMostReported": "The 5 most reported locations",
  "potholes.rankAllReportsNote": "Cumulative reports across all available years.",
  "potholes.rankMostPatched": "The 5 locations with the most patching",
  "potholes.rankNearbyRepairsNote": "Patching recorded within 25 m after the first report. A location may represent several potholes; individual repairs are not confirmed.",
  "potholes.rankStreetLocations": "The 5 streets with the most reported locations",
  "potholes.rankStreetLocationsNote": "Distinct published locations per street across all available years.",
  "potholes.rankStreetReturns": "The 5 streets with the most returning locations",
  "potholes.rankStreetReturnsNote": "New reports after presumed patching. Ranked by returning locations, then associated patching interventions.",
  "potholes.rankStreetPatching": "The 5 streets with the most patching",
  "potholes.rankStreetPatchingNote": "Distinct GPS interventions assigned to a street, even without a 311 report.",
  "potholes.rankUnpatched": "The 5 most reported locations without recorded patching",
  "potholes.rankUnpatchedNote": "Reports within the covered period, with no patching recorded within 25 m after the first report. Report volume alone does not establish that an intervention was due.",
  "potholes.rankOldest": "The 5 streets with the oldest reports without patching",
  "potholes.rankOldestNote": "Date of the oldest location without recorded patching. Other parts of the street may have been patched.",
  "potholes.rankRatioHeading": "The 5 streets with the most patching per report",
  "potholes.rankRatioNote": "Shared period and geolocated reports. Ratio = patching / reports, using a divisor of 1 when no report is recorded.",
  "potholes.rankMachines": "Patching by machine",
  "potholes.rankMachinesNote": "Published records across all years, including those without usable coordinates.",
  "potholes.rankUnusedMachines": "Machines not recorded in {year}",
  "potholes.rankUnusedMachinesNote": "Absent from the latest available partial file. The last recorded year of use is shown.",
  "potholes.rankLocation": "Location",
  "potholes.rankStreet": "Street",
  "potholes.rankDistricts": "{count} boroughs",
  "potholes.rankReports": "Reports",
  "potholes.rankNearbyRepairs": "Nearby patching",
  "potholes.rankLocations": "Locations",
  "potholes.rankRecurringLocations": "Returning locations",
  "potholes.rankReturns": "Returns",
  "potholes.rankRepairs": "Patching",
  "potholes.rankFirstReport": "First report",
  "potholes.rankUnpatchedLocations": "Affected locations",
  "potholes.rankRatio": "Ratio",
  "potholes.rankMachine": "Machine",
  "potholes.rankLastYear": "Last year",
  "potholes.rankNoResults": "No results in the available data.",
  "potholes.modeLabel": "Potholes and patching sections",
  "potholes.repairsTitle": "Patching",
  "potholes.repairsDocumentTitle": "Mechanical patching - Montreal",
  "potholes.repairsMapAria": "Map of historical mechanical patching interventions in Montreal",
  "potholes.repairCoverage": "File dates: {first} to {last}",
  "potholes.repairDatasetNote": "Historical, sometimes partial data. Manual repairs and future work are not covered.",
  "potholes.repairLegend": "Mechanical patching · {year}",
  "potholes.repairExcluded": "{count} selected interventions have unusable coordinates and are not displayed.",
  "potholes.repairViewCounts": "Interventions: {count} · Represented GPS locations: {positions}",
  "potholes.repairEmpty": "No mappable patching records in this view for these filters. The data does not cover all repairs.",
  "potholes.repairClusterTitle": "Grouped patching locations",
  "potholes.repairClusterEvents": "{count} interventions",
  "potholes.repairClusterTooltip": "{positions} GPS locations · {count} patching interventions",
  "potholes.repairPointTooltip": "Patching records: {count}\n{period}\nMachines: {devices}",
  "potholes.repairDate": "Date: {date}",
  "potholes.repairPeriod": "From {first} to {last}",
  "potholes.repairEventsLabel": "Interventions",
  "potholes.repairEventsDefinition": "GPS records from mechanical patching machines matching the filters. This is not a certified count of repaired potholes.",
  "potholes.repairLocationsLabel": "GPS locations",
  "potholes.repairLocationsDefinition": "Distinct coordinates of the selected interventions. Multiple visits, dates or machines may share the exact same location.",
  "potholes.repairClustersDefinition": "Clusters count GPS locations, not interventions. View totals include displayed clusters, which may extend beyond its edges.",
  "potholes.repairYearNote": "The year identifies the source file. Months reflect the dates actually present, sometimes from another year. This is not an active-period filter as in Potholes mode.",
  "potholes.repairSelectedCount": "Interventions at this location",
  "potholes.repairFirst": "First in selection",
  "potholes.repairLast": "Last in selection",
  "potholes.repairRecordPage": "Intervention {current} of {total} in selection",
  "potholes.roadMap": "Road restrictions",
  "potholes.roadMapLabel": "Return to the road restrictions map",
  "potholes.countsHelp": "About these counts",
  "potholes.knownReportsLabel": "Known reports",
  "potholes.knownReportsDefinition": "311 requests associated with the locations matching the filters, across all creation years. Several requests may refer to the same location.",
  "potholes.positionsLabel": "Locations",
  "potholes.positionsDefinition": "Distinct public locations grouping those requests. Coordinates are moved to a street segment midpoint, so a location does not necessarily represent a single pothole.",
  "potholes.clusterDefinition": "The number in a cluster counts locations, not 311 requests. View counts include the displayed points and clusters, even if a cluster extends beyond the map edge.",
  "potholes.clusterTitle": "Grouped locations",
  "potholes.clusterReports": "{count} known reports",
  "potholes.clusterTooltip": "{positions} pothole locations\nReports: {reports}\nActive: {active}\nPresumed repaired: {repaired}\nUnknown: {unknown}",
  "potholes.pointTooltipNone": "None",
  "potholes.pointTooltip": "Status: {status}\nReports: {count} since {year}\nPatching since first report: {repairs}",
  "potholes.reports": "311 reports",
  "potholes.repairs": "Mechanical patching",
  "potholes.reportYear": "Year",
  "potholes.allYears": "All",
  "potholes.noYears": "None",
  "potholes.mapStatus.active": "Active",
  "potholes.mapStatus.presumed-repaired": "Presumed repaired",
  "potholes.mapStatus.unknown": "Unknown status",
  "potholes.mapStatusNote": "One current status, independent of the displayed year. A new report after the latest nearby patching makes the location Active again; previous repairs remain in the history only. Repairs are presumed, not confirmed on site.",
  "potholes.activityYearNote": "The year refers to an active period, from a report to the next nearby patching, or with no known end. A location can be active in a year without a new report that year. A year entirely between a repair and reactivation is excluded.",
  "potholes.status311": "311 request status",
  "potholes.totalReports": "Reports (all years)",
  "potholes.selectedReports": "Reports in selection",
  "potholes.latestReport": "Latest known report",
  "potholes.latestRepair": "Latest nearby patching record",
  "potholes.timelineCounts": "Reports: {reports} · Nearby patching records: {repairs}",
  "potholes.timelineReport": "311 report",
  "potholes.timelineRepair": "Patching recorded within 25 m",
  "potholes.moreHistory": "Show more history",
  "potholes.repairHistoryExcluded": "{count} invalid GPS records are excluded from the patching dataset. History may be incomplete.",
  "potholes.repairYear": "Source file year",
  "potholes.month": "Month",
  "potholes.allMonths": "All months",
  "potholes.state": "Current status",
  "potholes.open": "Open requests",
  "potholes.closed": "Closed requests",
  "potholes.unknown": "Unknown status",
  "potholes.allStates": "All statuses",
  "potholes.district": "Borough",
  "potholes.allDistricts": "All boroughs",
  "potholes.search": "Street, intersection or 311 request number",
  "potholes.searchPlaceholder": "Street, intersection or 311 request",
  "potholes.device": "Patching machine",
  "potholes.allDevices": "All machines",
  "potholes.filters": "Filters and results",
  "potholes.mapFilters": "Filters",
  "potholes.loading": "Loading data…",
  "potholes.loadError": "Data unavailable. Loading can be retried.",
  "potholes.retry": "Retry",
  "potholes.coverage": "Reports at selected locations: {first} to {last}",
  "potholes.reportCounts": "Known reports: {count} · Locations: {positions}",
  "potholes.repairCounts": "{count} interventions · {positions} GPS locations",
  "potholes.noCoordinates": "No mappable locations among {count} records in this file.",
  "potholes.excluded": "{count} requests in the dataset have no mappable location. Their active period cannot be determined.",
  "potholes.sources": "Sources and data limitations",
  "potholes.verified": "Dataset last checked: {date}",
  "potholes.dataUpdated": "Data last updated: {date}",
  "potholes.dataUpdateUnavailable": "Data update date unavailable.",
  "potholes.verificationUnavailable": "Dataset verification date unavailable.",
  "potholes.modified": "File content modified on {date}",
  "potholes.sourceCount": "{source} {year}: {count} records, including {mapped} mappable records before filtering.",
  "potholes.informationCount": "{count} information requests with no pothole location.",
  "potholes.scopeNote": "City of Montreal data. Coverage is not assured for other Greater Montreal municipalities.",
  "potholes.positionNote": "311 locations are relocated to the midpoint of a street segment longer than 45 m. They are not exact pothole locations. Borough office coordinates are excluded.",
  "potholes.statusNote": "A closed 311 request does not confirm a repair. It may be completed, cancelled, refused or deleted. Status comes from our latest copy of the data, not a field inspection.",
  "potholes.repairNote": "GPS records of mechanical patching only, not a certified count of repaired potholes. Manual repairs and future work are not covered.",
  "potholes.matchNote": "Nearby patching means work recorded within 25 m of the public 311 location. It may concern a different pothole: the City does not confirm a link to this report.",
  "potholes.yearNote": "Annual files may be partial or contain dates from another year. Displayed periods reflect the dates actually present, without guaranteeing continuous coverage.",
  "potholes.sources311": "Official source: 311 requests",
  "potholes.sourcesRepairs": "Official source: mechanical patching",
  "potholes.snapshotIndex": "Data file list (JSON)",
  "potholes.results": "In this view",
  "potholes.viewCounts": "Known reports: {reports} · Represented locations: {positions}",
  "potholes.empty": "No mappable results in this view for these filters. This does not guarantee the absence of potholes.",
  "potholes.noLayers": "No layers selected.",
  "potholes.more": "Show more results",
  "potholes.reportGroups": "Grouped reports",
  "potholes.repairGroups": "Grouped patching records",
  "potholes.groupArea": "Multiple locations in this area",
  "potholes.unknownStreet": "Public 311 location",
  "potholes.repairPosition": "Mechanical patching",
  "potholes.mapAria": "Map of Montreal potholes and their estimated statuses",
  "potholes.mapTools": "Map controls",
  "potholes.legend": "Report and intervention legend",
  "potholes.details": "Location details",
  "potholes.close": "Close details",
  "potholes.previous": "Previous record",
  "potholes.next": "Next record",
  "potholes.records": "Records at this location",
  "potholes.recordPage": "Request {current} of {total} in selection",
  "potholes.notPublished": "Not published",
  "potholes.reportId": "311 request",
  "potholes.created": "Created",
  "potholes.statusDate": "Latest status date",
  "potholes.statusDelay": "Time to latest status",
  "potholes.days": "{count} days",
  "potholes.nature": "Request type",
  "potholes.locationType": "Location type",
  "potholes.intersections": "Published intersections",
  "potholes.postalCode": "Postal code",
  "potholes.responsible": "Responsible unit",
  "potholes.origin": "Published reporting channel",
  "potholes.coordinates": "Published coordinates",
  "potholes.administrative": "Administrative details",
  "potholes.history": "History at this location",
  "potholes.historyUnavailable": "Patching history is unavailable. The report timeline remains available but is incomplete.",
  "potholes.historyTotal": "{count} requests, from {first} to {last}.",
  "potholes.historyNote": "Oldest to newest, across all years and 311 statuses. Patching was recorded within 25 m after the first report; it does not confirm a repair of this specific pothole. Several potholes may share this location.",
  "potholes.estimatedMatch": "Patching recorded nearby",
  "potholes.noMatch": "No patching recorded within 25 m after this request in the available data. This does not prove that no repair occurred.",
  "potholes.outOfCoverage": "This request is newer than the latest available patching record. No repair follow-up can be inferred.",
  "potholes.nearbyTraces": "{count} GPS records within {radius} m, across all dates in the dataset.",
  "potholes.observedTime": "Published date and time",
  "potholes.distance": "Distance from 311 location",
  "potholes.afterReport": "After the report",
  "potholes.confidence": "Heuristic rating from available data",
  "potholes.confidence.elevee": "High (heuristic)",
  "potholes.confidence.moyenne": "Medium (heuristic)",
  "potholes.confidence.faible": "Low (heuristic)",
  "potholes.confidence.aucune": "None",
  "potholes.beforeLastStatus": "No later than latest status",
  "potholes.yes": "Yes",
  "potholes.no": "No",
  "potholes.sourceYear": "Source file: {year}",
  "potholes.officialSource": "View the official source",
  "potholes.locate": "My location",
  "potholes.locating": "Finding your location…",
  "potholes.locateError": "Location unavailable or permission denied.",
  "potholes.tileError": "Some map tiles are unavailable. Loaded records remain available.",
  "potholes.reset": "Recenter on Montreal",
  "potholes.resetFilters": "Reset all filters",
  "potholes.status.terminee": "Completed (311)",
  "potholes.status.annulee": "Cancelled",
  "potholes.status.refusee": "Refused",
  "potholes.status.supprimee": "Deleted",
  "potholes.status.acceptee": "Accepted",
  "potholes.status.prise-en-charge": "In progress",
  "potholes.status.transmise-pour-traitement": "Forwarded for processing",
  "potholes.status.reactivee": "Reopened",
  "potholes.status.urgente": "Urgent",
  "potholes.nature.requete": "Request",
  "potholes.nature.plainte": "Complaint",
  "potholes.nature.commentaire": "Comment",
  "potholes.nature.information": "Information",
  "potholes.place.adresse": "Address",
  "potholes.place.intersection": "Intersection",
  "potholes.place.troncon": "Street segment",
  "nav.install": "Install app",
  "nav.installHelp": "In Safari, tap Share, then Add to Home Screen.",
  "nav.installHelpChrome": "In Chrome, open the ⋮ menu, then choose Install page as app or Add to Home Screen.",
  "nav.installHelpBrowser": "Use your browser's menu to add this site to your Home Screen or Dock.",
  "list.more": "more restrictions in the visible area",
  "list.refine": "Narrow the list by date, street or responsible organization.",
  "pedestrian.document.mapTitle": "Pedestrian restrictions - Greater Montreal",
  "pedestrian.map.title": "Pedestrian restrictions",
  "pedestrian.map.intro": "Pedestrian restrictions consolidated from municipal and regional sources. Partial coverage: no listed restriction does not guarantee a clear or accessible passage.",
  "pedestrian.map.interactiveLabel": "Pedestrian restrictions map of Greater Montreal",
  "pedestrian.map.legendLabel": "Pedestrian impact legend",
  "pedestrian.map.loading": "Loading the pedestrian restrictions snapshot...",
  "pedestrian.map.loadError": "Unable to load pedestrian impacts. No driving fallback data is used.",
  "pedestrian.map.sourcesText": "Consolidated snapshot, not a live feed. Each entry retains its official link and source verification date. Reused local snapshots keep their previous extraction dates.<br>Pedestrian and cycling impacts are distinguished. A cycleway closure does not confirm a pedestrian closure. Notices without verified geometry are presented separately. Arrangements announced by Montreal do not imply a complete closure. The opposite side is never inferred. Base map: OpenStreetMap.",
  "pedestrian.filters.sourceHelp": "Published responsible party, separate from the organization providing the data. Eligible pedestrian and cycling impacts from the snapshot.",
  "pedestrian.filters.impactGroupLabel": "Types of walking or cycling impact",
  "pedestrian.filters.critical": "Confirmed closure",
  "pedestrian.filters.moderate": "Arrangements / works",
  "pedestrian.filters.impactHelp": "<p><strong>Confirmed closure:</strong> an explicitly published passage closure, such as a closed path in Longueuil.</p><p><strong>Arrangements / works:</strong> Montreal announces pedestrian arrangements or work in a park. Raw blocked, obstructed or closed codes do not by themselves establish a complete pedestrian closure.</p>",
  "pedestrian.severity.critical": "Confirmed closure",
  "pedestrian.severity.moderate": "Arrangements / works",
  "pedestrian.areas": "Affected areas",
  "pedestrian.area": "Affected area",
  "pedestrian.area.sidewalk": "Sidewalks",
  "pedestrian.area.park": "Parks",
  "pedestrian.area.path": "Paths / cycleways",
  "pedestrian.affectedUsers": "Affected users",
  "pedestrian.cyclists": "Cyclists (pedestrian impact unconfirmed)",
  "pedestrian.cyclingImpact": "Cycling impact",
  "pedestrian.unmappedNotices": "Notices without verified geometry",
  "pedestrian.noticeSource": "Municipal notice",
  "pedestrian.category.private": "Other responsible parties",
  "pedestrian.list.none": "No pedestrian restrictions found",
  "pedestrian.list.noneHint": "Check the dates, filters and map area. Coverage is partial; no listed restriction does not confirm accessibility.",
  "pedestrian.popup.impact": "Pedestrian impact",
  "pedestrian.popup.direction": "Side / direction",
  "pedestrian.pathClosed": "Path closed according to the source.",
  "pedestrian.directionUnknown": "Side and direction are not specified in the fields used. See the detailed notice for announced arrangements.",
  "pedestrian.geometryNote": "Official worksite location or footprint, not an exact sidewalk outline or walking route. The affected side and accessibility are not inferred from this geometry.",
  "pedestrian.pointNote": "Official location point. No precise outline of the affected passage is published in the fields used.",
  "pedestrian.reference": "Reference",
  "popup.reference": "Reference",
  "popup.sourceId": "Source identifier",
  "pedestrian.noticeChecked": "Notice checked (snapshot)",
  "pedestrian.noticeUnchecked": "Notice not in the snapshot; consult the source",
  "pedestrian.noticeSnapshot": "Montreal notice details (snapshot)",
  "pedestrian.sourceChecked": "Source checked on",
  "pedestrian.generatedAt": "Consolidation generated on",
  "pedestrian.failedSources": "Feeds not verified during this consolidation:",
  "pedestrian.snapshotLink": "Data and source audit (JSON)",
  "pedestrian.side": "Published side",
  "pedestrian.side.unknown": "Not specified",
  "pedestrian.side.not-applicable": "Entire passage",
  "pedestrian.side.north": "North",
  "pedestrian.side.south": "South",
  "pedestrian.side.east": "East",
  "pedestrian.side.west": "West",
  "pedestrian.endDate": "Published end",
  "pedestrian.openEnded": "Not published; source status was active when verified",
  "pedestrian.additionalInfo": "Published additional information",
  "pedestrian.publishedType": "Published raw impact",
  "pedestrian.intermittent": "Published intermittent closure",
  "pedestrian.workType": "Published work type",
  "pedestrian.workCategory": "Published category",
  "pedestrian.description": "Published description",
  "pedestrian.scheduleUnknown": "Detailed schedule",
  "pedestrian.sourceFailure": "Unavailable or incomplete pedestrian source:",
  "pedestrian.loaded": "Pedestrian impacts loaded",
  "nav.faq": "FAQ",
  "nav.comments": "Comments?",
  "nav.missing": "Missing<br>restrictions?",
  "nav.missingLabel": "Report a missing road restriction",
  "faq.q.missing": "Is a road restriction missing from the map?",
  "faq.a.missing": "You can report a missing road restriction in Greater Montréal using the dedicated form. Include the municipality, street or road, exact location and impact on vehicle traffic. Add dates, hours and a link to an official advisory if available. Reports are checked before anything is added: submitting the form does not guarantee publication or a reply. This form is not an emergency service. Do not fill it out while driving.",
  "faq.missingLink": "Report a missing road restriction",
  "map.region": "Greater Montreal area",
  "map.title": "Road restrictions map",
  "map.intro": "A driving map for locating closed streets, removed lanes, UCI restrictions and areas where detours are likely.",
  "map.interactiveLabel": "Interactive map of Montreal",
  "map.instruction": "Click a colored line to see work details.",
  "map.tipLabel": "Map usage tip",
  "map.tipTitle": "Quick tip",
  "map.tipText": "Click a colored line to view dates, details and detours.",
  "map.tipClose": "Close this tip",
  "map.loading": "Loading road restrictions from multiple official sources...",
  "map.loadingInitial": "Loading the map...",
  "map.tileError": "The map background is having trouble loading. Closures remain visible, but check your connection.",
  "map.loadError": "Unable to load the official APIs. Fallback data remains displayed.",
  "map.apiUnavailable": "Official APIs are unavailable: showing fallback data only.",
  "map.dataLoaded": "Data loaded",
  "map.legendLabel": "Traffic impact legend",
  "map.sources": "Sources",
  "map.sourcesLabel": "Official sources",
  "map.sourcesClose": "Close sources",
  "map.sourcesText": "The complete list of sources and links is available in the <a href=\"faq.html#sources-utilisees\">FAQ</a>.",
  "map.closeDetails": "Close details",
  "menu.open": "Open menu",
  "menu.close": "Close menu",
  "menu.resize": "Adjust menu width",
  "filters.label": "Filters",
  "filters.dates": "Dates",
  "filters.today": "Today",
  "filters.start": "Start",
  "filters.end": "End",
  "filters.dateHelpLabel": "Information about the date range",
  "filters.dateHelp": "The period shows restrictions that affect at least one day between the two dates, even if they last only a few hours or days.",
  "filters.time": "Work period",
  "filters.timeHelpLabel": "Information about daytime and nighttime work",
  "filters.timeHelp": "<p><strong>Day:</strong> restrictions outside the nighttime period.</p><p><strong>Night:</strong> any restriction affecting 10 p.m. to 5 a.m., even if it starts before 10 p.m. or ends after 5 a.m.</p>",
  "filters.day": "Day",
  "filters.night": "Night",
  "filters.source": "Authority / source",
  "filters.sourceHelpLabel": "Information about authority and source",
  "filters.sourceHelp": "Use this filter to choose the published source or authority for closures: the City of Montreal, private sectors, events, major routes or independent municipal sources.",
  "filters.sourceGroupLabel": "Restriction authority or source",
  "filters.impact": "Traffic impact",
  "filters.impactHelpLabel": "Information about traffic impact types",
  "filters.impactHelp": "<p><strong>Full closure:</strong> traffic is prohibited on the published segment.</p><p><strong>Lane affected:</strong> a traffic lane is removed.</p><p><strong>Limited access:</strong> local traffic or a temporary direction.</p><p><strong>Parking:</strong> the street remains open, but parking is removed or prohibited.</p>",
  "filters.impactGroupLabel": "Traffic impact types",
  "filters.critical": "Full closure",
  "filters.major": "Lane affected",
  "filters.moderate": "Limited access",
  "filters.parking": "Parking",
  "summary.visible": "visible restrictions",
  "summary.reset": "Recenter",
  "municipalities.title": "Linked-city work sources",
  "municipalities.helpLabel": "Information about independent municipalities",
  "municipalities.help": "These 15 municipalities are on the Island of Montreal, but are not always included in the City's Info-entraves feed. Links point to their official work, project or public notice pages.",
  "municipalities.note": "There is no single public source that normalizes all of these cities. This section includes official sources to consult or connect in a future data layer.",
  "list.title": "Active restrictions",
  "list.searchLabel": "Search",
  "location.button": "Show my location",
  "location.loading": "Finding your location...",
  "location.found": "Map centred on your location. The circle shows the estimated accuracy.",
  "location.nearby": "Show restrictions around me",
  "visualAssist.on": "Screen reader mode",
  "visualAssist.onLabel": "Turn on screen reader mode",
  "visualAssist.off": "Standard view",
  "visualAssist.offLabel": "Return to the standard view",
  "map.zoomIn": "Zoom in",
  "visualAssist.panelLabel": "Search and active restrictions",
  "map.zoomOut": "Zoom out",
  "location.foundList": "Location found. The list now shows restrictions around you.",
  "location.denied": "Location access denied. Allow location access in your browser settings, then try again.",
  "location.timeout": "Finding your location took too long. Please try again.",
  "location.unavailable": "Your location is unavailable. Check that location services are enabled on your device, then try again.",
  "location.unsupported": "Location is unavailable in this browser or on this connection. HTTPS or localhost is required.",
  "list.searchPlaceholder": "Search for a street, a neighbourhood or a city...",
  "list.none": "No driving restriction found",
  "list.noneHint": "Change the date, filters or map view.",
  "severity.critical": "Full closure",
  "severity.closedStreet": "Street closed",
  "severity.closedRoad": "Road closed",
  "severity.closedRoute": "Route closed",
  "severity.closedHighway": "Highway closed",
  "severity.closedBridge": "Bridge closed",
  "severity.closedTunnel": "Tunnel closed",
  "severity.major": "Lane affected",
  "severity.moderate": "Limited access",
  "severity.parking": "Parking",
  "severity.minor": "Minor impact",
  "category.municipal": "City",
  "category.citizen": "Citizen reports",
  "citizen.sourceKind": "Source type",
  "citizen.unofficial": "Citizen declaration, not an official municipal notice. Restriction not officially confirmed.",
  "citizen.origin": "Reported information origin",
  "citizen.observed": "Observation or consultation",
  "citizen.dates": "Reported dates and caveats",
  "citizen.details": "Full comment",
  "citizen.warnings": "Caveats",
  "citizen.geometry": "Verified street geometry",
  "citizen.geometryOnly": "The municipal street dataset verifies the road geometry, not the restriction.",
  "citizen.verified": "Last report verification",
  "citizen.schedule": "Reported schedule",
  "citizen.activeNow": "Currently within the reported schedule; on-site conditions are not confirmed.",
  "citizen.inactiveNow": "Currently outside the reported date range or schedule.",
  "category.private": "Private sectors",
  "category.linkedCity": "Linked cities",
  "category.commercial": "Commercial streets",
  "category.event": "Events",
  "category.regional": "Major routes",
  "category.q511": "Quebec 511",
  "category.laval": "Laval",
  "category.longueuil": "Longueuil",
  "category.strike": "Strikes / demonstrations",
  "laval.closed": "Closed streets",
  "laval.partial": "Partial restriction",
  "laval.planned": "Planned restriction",
  "source.open": "Open source",
  "popup.one": "1 restriction at this location",
  "popup.many": "restrictions at this location",
  "popup.otherNearby": "other nearby restrictions. Zoom in or filter to isolate them.",
  "popup.to": "to",
  "schedule.label": "Published schedule",
  "schedule.to": "to",
  "popup.at": "at",
  "schedule.allDay": "24 hours a day",
  "schedule.Mon": "Mon",
  "schedule.Tue": "Tue",
  "schedule.Wed": "Wed",
  "schedule.Thu": "Thu",
  "schedule.Fri": "Fri",
  "schedule.Sat": "Sat",
  "schedule.Sun": "Sun",
  "popup.responsible": "Authority",
  "popup.period": "Period",
  "popup.impact": "Traffic impact",
  "popup.direction": "Direction",
  "popup.geometryNote": "Geometry",
  "popup.tunnelNote": "This tracing follows a tunnel — it is drawn beneath the surface streets shown on the map.",
  "popup.notPublished": "not published",
  "popup.unknownPeriod": "Dates unknown",
  "popup.startDate": "Start",
  "popup.endDate": "End",
  "popup.dayNight": "Day and night",
  "popup.night": "Night (10 p.m. to 5 a.m.)",
  "popup.day": "Day",
  "abbreviation.MTMD": "Ministry of Transport and Sustainable Mobility",
  "abbreviation.VM": "Ville-Marie",
  "abbreviation.SO": "Le Sud-Ouest",
  "abbreviation.RPP": "Rosemont–La Petite-Patrie",
  "abbreviation.AC": "Ahuntsic-Cartierville",
  "abbreviation.CDNNDG": "Côte-des-Neiges–Notre-Dame-de-Grâce",
  "abbreviation.SLR": "Saint-Laurent",
  "abbreviation.LCH": "Lachine",
  "abbreviation.LSL": "LaSalle",
  "abbreviation.ANJ": "Anjou",
  "abbreviation.OUT": "Outremont",
  "abbreviation.RDPPAT": "Rivière-des-Prairies–Pointe-aux-Trembles",
  "abbreviation.PFDROX": "Pierrefonds-Roxboro",
  "abbreviation.IBZSGV": "L'Île-Bizard–Sainte-Geneviève",
  "abbreviation.SLN": "Saint-Léonard",
  "abbreviation.VRD": "Verdun",
  "abbreviation.VSMPE": "Villeray–Saint-Michel–Parc-Extension",
  "abbreviation.MHM": "Mercier–Hochelaga-Maisonneuve",
  "abbreviation.MTN": "Montréal-Nord",
  "abbreviation.PMR": "Le Plateau-Mont-Royal",
  "abbreviation.UCI": "Union Cycliste Internationale",
  "abbreviation.BIXI": "public bike-sharing network",
  "abbreviation.OSRM": "Open Source Routing Machine",
  "abbreviation.WFS": "Web Feature Service",
  "abbreviation.API": "application programming interface",
  "abbreviation.Open511": "open traffic-event format",
  "abbreviation.ArcGIS": "geographic services platform",
  "abbreviation.CKAN": "open-data cataloguing platform",
  "faq.eyebrow": "Road restrictions map",
  "faq.title": "Frequently asked questions",
  "faq.intro": "Useful pointers for using the map and understanding what the displayed restrictions mean for your trip.",
  "faq.potholesHelp": "For questions about potholes and patching, see the dedicated FAQ:",
  "faq.about": "About",
  "faq.use": "Using the map",
  "faq.data": "Data and freshness",
  "faq.travel": "Planning a trip",
  "faq.sectionNav": "FAQ sections",
  "faq.openMap": "Open the road restrictions map",
  "faq.publicNote": "The displayed data is public, but on-site conditions and road signs always take priority.",
  "faq.sourcesCaption": "Sources used by the map",
  "faq.sourcesHeader": "Source",
  "faq.municipalityHeader": "Municipality",
  "faq.typeHeader": "Data type",
  "faq.sourceRegional": "Network / regional",
  "faq.sourceProvincial": "Provincial",
  "faq.metroRegion": "Greater Montreal area",
  "faq.linkHeader": "Link",
  "faq.live": "Live",
  "faq.snapshot": "Snapshot",
  "faq.snapshotUpdated": "Last updated",
  "faq.all": "All",
  "faq.top": "Back to top",
  "faq.profile": "My LinkedIn:",
  "faq.instagram": "My Instagram:",
  "faq.feedbackLink": "Comments & Improvements",
  "faq.sourceLink": "Open source"
  ,"faq.q.aboutCreated": "Why was this map created?"
  ,"faq.a.aboutCreated": "It was becoming surprisingly difficult to know which street would close, when, in which direction and for how long. The highways were no easier. The information existed, but it was scattered. This map brings it together in one place, before a detour becomes a weekend project."
  ,"faq.q.aboutName": "Why is it called cestdejalenfer.ca?"
  ,"faq.a.aboutName": "The name is a nod to very public conversations about difficult travel in Montreal, including the phrase “it's going to be hell” associated with Mayor Soraya Martínez Ferrada. For many people driving since the beginning of summer, the more direct observation is that it is already complicated. A map helps."
  ,"faq.q.aboutCreator": "Who created this site?"
  ,"faq.a.aboutCreator": "My name is Shelsea Saint-Fleur. I built this project in my free time with the simple goal of making road restrictions a little less mysterious. The site is a work in progress, which is normal: construction changes, public data evolves and nobody has figured out how to make orange cones disappear."
  ,"faq.q.aboutCode": "Would you like to see the code or contribute to the project?"
  ,"faq.a.aboutCode": "The site's code and changes are public on GitHub. You can explore the project, leave comments, open a change request or suggest improvements directly in the repository."
  ,"faq.aboutCodeLink": "View the GitHub repository"
  ,"faq.q.aboutFeedback": "Would you like to leave feedback or suggest an improvement?"
  ,"faq.a.aboutFeedback": "You can share your comments and ideas through the form"
  ,"faq.q.colors": "What do the colors mean?"
  ,"faq.a.colors": "<p>The colors represent the traffic impact assigned by the map:</p><ul><li><strong><span class=\"impact-word critical\">Red</span> - Full closure:</strong> motor-vehicle traffic is prohibited on the published segment or access.</li><li><strong><span class=\"impact-word major\">Orange</span> - Lane affected:</strong> at least one traffic lane is removed, closed or reorganized, while the street generally remains open.</li><li><strong><span class=\"impact-word moderate\">Yellow</span> - Limited access:</strong> local traffic, the direction of travel or access conditions are temporarily restricted.</li><li><strong><span class=\"impact-word parking\">Pink</span> - Parking:</strong> car parking spaces are removed or prohibited for a defined period, without a full street closure.</li></ul><p>These are the map's colors; they are not an interpretation of colors used by the original data sources.</p>"
  ,"faq.q.parkingImpact": "What does the « Parking » impact type mean?"
  ,"faq.a.parkingImpact": "<p>This category is used when the street remains open, but car parking spaces are removed or prohibited for a defined period. It can include:</p><ul><li><strong>Road work:</strong> parking spaces removed or reserved during construction, even when no traffic lane is closed.</li><li><strong>Temporary restrictions:</strong> parking prohibited for an event, delivery, maintenance operation or other published intervention.</li><li><strong>On-street BIXI stations:</strong> parking spaces occupied by a station that official data identifies as installed in curbside parking. BIXI stations located on a sidewalk, in a park or in an off-street parking facility are not shown as an impact on car parking.</li></ul>"
  ,"faq.q.legend": "Why are some colors missing from the legend?"
  ,"faq.a.legend": "The legend at the bottom of the map follows the choices in the Traffic impact filter. An unchecked category is hidden from the map and removed from the legend."
  ,"faq.q.viewport": "Why does the restriction list change when I move the map?"
  ,"faq.a.viewport": "The Active restrictions section shows only restrictions that intersect the currently visible area. Dates, sources, traffic impact, work period and search are added to this geographic filter."
  ,"faq.q.seeWork": "How can I see the work at a location?"
  ,"faq.a.seeWork": "You can use the filters and the Active restrictions list in the menu. On the map, click a line, area or marker to open the published details. Points represent official locations when a source does not publish a trace; they do not necessarily show the full length of the worksite."
  ,"faq.q.search": "How can I search for a street or area?"
  ,"faq.a.search": "Use the search field above the restriction list. It searches streets, boroughs, municipalities, authorities, impacts and published directions."
  ,"faq.q.pedestrianMode": "What is Walking mode, and how is it different from Driving mode?"
  ,"faq.a.pedestrianMode": "<p>The map has two modes, available with the <strong>Driving</strong> and <strong>Walking</strong> buttons in the menu. Switching modes keeps your language, the displayed area and the selected dates.</p><ul><li><strong>Driving mode:</strong> restrictions affecting car traffic in Greater Montreal, such as closed streets or bridges, lane reductions, limited access and affected parking. The colours show the impact for drivers.</li><li><strong>Walking mode:</strong> restrictions affecting walking or cycling, on sidewalks, in parks and on paths or bike lanes. Red means a closure confirmed by the source, and orange means announced arrangements or works.</li></ul><p>A car restriction is not automatically a pedestrian restriction: a street closed to cars may keep its sidewalks open. Likewise, a closed bike lane is not shown as a car restriction. Each mode therefore uses its own data and its own rules.</p><p>In Walking mode, the Affected areas filter lets you choose sidewalks, parks, or paths and bike lanes. The data comes from a consolidated snapshot of municipal and regional sources, updated regularly rather than live.</p><p>Coverage remains partial: the absence of a restriction on the map does not guarantee that a route is clear or accessible. The affected side of the street is shown only when the source publishes it.</p>"
  ,"faq.q.visualAssist": "What is Screen reader mode?"
  ,"faq.a.visualAssist": "<p>Screen reader mode is a version of the Walking map designed for blind or partially sighted people who navigate with a screen reader such as VoiceOver. It is available on phones and tablets.</p><p>This mode grew out of feedback from a person at the CNIB Foundation, which supports people living with sight loss. She took the time to test the map with VoiceOver on her iPhone and to show us, on video, the obstacles she ran into: a search field that was hard to activate and a list of restrictions that could not be reached inside the menu. Her observations guided every change in this mode. Thank you!</p><p><strong>To turn it on:</strong> on the Walking map, open the menu and tap Screen reader mode. In the same place, the button becomes Standard view to return to the usual display. Your choice is remembered on the device, so the map opens in the same mode on your next visit.</p><p><strong>In short, what changes compared with the standard view:</strong></p><ul><li>Only the Walking map is offered: the Driving / Walking choice is removed.</li><li>The screen is split: the map fills the top half, and the list of restrictions is always visible in the bottom half, without going through the menu.</li><li>The Show restrictions around me button and the search bar sit above the list and stay visible while scrolling.</li><li>The map's detail windows are simplified: they show only the information found in the list cards.</li></ul><p><strong>With VoiceOver:</strong> after the menu button, VoiceOver goes straight to the location button, the search field and then the restriction cards, without having to move through the map. Each card starts with a level 3 heading: with the rotor set to Headings, you move from one restriction to the next with a single swipe. The Show restrictions around me button asks for your location; the list then shows only nearby restrictions, and VoiceOver announces the result.</p><p><strong>Tip for returning to the search field:</strong> tap the top of the screen with four fingers to return to the first item, then swipe right until you reach the search field. The search bar also always stays in the same place, just below the map.</p><p>This mode keeps evolving. If you use a screen reader, your feedback is valuable: write to us with the Comments? link in the menu.</p>"
  ,"faq.q.installApp": "How do I install the map as an app on my phone?"
  ,"faq.a.installApp": "<p><strong>In short:</strong> there is nothing to download from the App Store or Google Play. You simply add the site to the home screen of your phone or tablet. An icon then appears like any other app, and the map opens full screen, without the browser bar. It is free and no account is needed.</p><p>Once installed, the app reopens the map in the last mode used (Driving or Walking) and can centre itself on your location when it opens, if you allow it.</p><p>In some browsers, the Install app button on the map opens the installation window directly. Otherwise, here are the steps for your device:</p><ul><li><strong>iPhone or iPad, with Safari:</strong> tap the Share button (the square with an upward arrow; depending on the version, it may be in the … menu), then Add to Home Screen, and confirm with Add.</li><li><strong>iPhone or iPad, with Chrome:</strong> tap the Share button in the address bar, then Add to Home Screen.</li><li><strong>Android, with Chrome:</strong> tap the ⋮ menu at the top right, then Install app or Add to Home screen, and confirm.</li><li><strong>Android, with Samsung Internet:</strong> tap the ☰ menu at the bottom, then Add page to and Home screen.</li><li><strong>Android, with Firefox:</strong> tap the ⋮ menu, then Install or Add to Home screen.</li><li><strong>Android, with Edge:</strong> tap the … menu at the bottom, then Add to phone or Install app.</li></ul><p>Menu names may vary slightly depending on the browser version. To remove the app, simply delete its icon like any other app.</p>"
  ,"faq.q.arrows": "Why does an arrow appear on some segments?"
  ,"faq.a.arrows": "The arrow shows the orientation of the displayed geometry for a segment, not necessarily the legal direction of traffic. It helps distinguish directional restrictions when the source provides a line. Arrows are used only for line geometries, and some are hidden at low zoom or in very dense views to keep the map readable."
  ,"faq.q.freshness": "When is the data updated?"
  ,"faq.a.freshness": "<p><strong>Whenever the page opens or refreshes:</strong> live public feeds are requested again from the organizations that publish them. This includes Montreal, Laval, Longueuil, MTMD/Quebec 511 and the available municipal integrations.</p><p><strong>Snapshots:</strong> some sources do not provide a feed that can be used by a static application. Their latest extraction is kept in a local file and marked as “Snapshot” in the source table. These files are updated regularly, but they are not reloaded automatically on every visit.</p><p><strong>Geometry:</strong> OSRM and Overpass may be used to align or complete some geometries. These deterministic results are kept in the browser session cache to avoid repeating the same calculation during the session; restriction data itself is still requested again on a new page load or refresh.</p><p><strong>Montreal tracings:</strong> Montreal's official restriction feed almost never publishes the segment line. Each impact is therefore resolved offline against the City's official road base (every displayed segment is a real street section, chained between the intersections published by the permit). When resolution is impossible, the official work-zone footprint is shown with dashed lines and identified as such in the detail card.</p><p><strong>Limits:</strong> publication frequency, delays and outages depend on each organization. On-site conditions and road signs always take priority.</p>"
  ,"faq.q.sources": "Which sources are used?"
  ,"faq.a.sources": "The table below contains only sources that currently contribute data loaded or drawn by the map, including snapshot files used by the application. Documentary pages and candidate sources in the catalog are not shown here until a map loader uses them."
  ,"faq.a.snapshotNote": "Snapshots are dated copies, not live feeds. Citizen declarations and unofficial supplementary sources are identified as such. Their verification date advances only after a successful check; an incomplete or failed check keeps the previous date."
  ,"faq.a.sourceAvailability": "<strong>Checked on October 3, 2026:</strong> Mont-Saint-Hilaire's five project layers are accessible to the extraction process again, but their seasonal schedules cannot be treated as dated restrictions on the map. The <a href=\"https://info-travaux.ville.repentigny.qc.ca/api/events/\" target=\"_blank\" rel=\"noopener noreferrer\">Repentigny Info-travaux feed</a> fails to establish a secure connection from our verification environment; the municipal website still lists that address and no replacement has been confirmed. The Noovo supplement keeps its September 8 date because the original image and some schedules could not be reverified."
  ,"faq.q.snapshots": "What are snapshot data, and how often are they updated?"
  ,"faq.a.snapshots": "Snapshots are copies of data kept in local files, notably when a service cannot be loaded directly by a static application. They are updated separately, not on every map visit. The Data type column in the source table identifies them. For road restrictions, the verification date records the last complete successful check, even when the records have not changed. The Walking map distinguishes the assembly date from each source's freshness: a failed source is not declared up to date. A citizen declaration or Noovo supplement is not an official municipal notice."
  ,"faq.q.mtmd": "Why are Quebec 511 restrictions attributed to MTMD?"
  ,"faq.a.mtmd": "Road work comes from the Ministry of Transport and Sustainable Mobility's public GeoJSON, published on Données Québec. This feed provides dates, direction, detours, restriction type and official segment geometry."
  ,"faq.q.laval": "Where does the Laval data come from?"
  ,"faq.a.laval": "It comes from the City of Laval's official Info-Travaux service, the same one behind its public map. That service's standard search does not return geometry, but its identify operation covering the whole territory provides each restriction with its official geometry, dates, restriction type, traffic impact, work type, authority and reference number. Laval restrictions therefore display like every other source, with the same colours, the same list and the same detail cards."
  ,"faq.q.abbreviations": "What do the abbreviations used in the map mean?"
  ,"faq.a.abbreviations": "<p><strong>MTMD:</strong> Quebec's Ministry of Transport and Sustainable Mobility.</p><p><strong>UCI:</strong> Union Cycliste Internationale, the organization associated with the 2026 cycling world championships.</p><p><strong>BIXI:</strong> Montreal's public bike-sharing network.</p><p><strong>OSRM:</strong> Open Source Routing Machine, used to align some axes with the road network.</p><p><strong>WFS:</strong> Web Feature Service, a standard service for providing geographic data.</p><p><strong>Open511:</strong> an open format and service for publishing traffic-related events.</p><p><strong>ArcGIS:</strong> a geographic services platform used by several public organizations.</p><p><strong>CKAN:</strong> a platform for cataloguing and distributing open data.</p>"
  ,"faq.q.coverage": "Does the data cover every road?"
  ,"faq.a.coverage": "No. The map depends on restrictions published by the responsible organizations. An urgent closure, private restriction, one-time event or very recent change may appear with a delay or may not be available in public feeds."
  ,"faq.q.navigation": "Does the map replace a navigation app?"
  ,"faq.a.navigation": "No. It helps identify areas at risk and understand restrictions before leaving. Check your route in your usual navigation tool and always follow on-site signs."
  ,"faq.q.continuous": "Do the dates indicate a continuous restriction?"
  ,"faq.a.continuous": "Not necessarily. The map also shows temporary restrictions, daytime or nighttime work, lane removals, limited access, parking restrictions and closures that apply only during certain hours. Dates define the general period during which a restriction may apply; they do not automatically mean that the road is closed without interruption. Check the published details for hours, direction, affected lanes, detours and exceptions."
  ,"faq.q.dayNight": "What do the Day and Night filters mean?"
  ,"faq.a.dayNight": "The Night filter keeps restrictions affecting 10 p.m. to 5 a.m. The Day filter shows other restrictions active during the day. A continuous restriction can appear in both categories."
  ,"faq.q.dateFilter": "Why does a restriction not appear after I choose a date?"
  ,"faq.a.dateFilter": "First check the visible map area, selected sources and traffic impact. The list shows only restrictions matching all filters and located within the current map view."
  ,"nav.stats": "Statistics"
  ,"stats.title": "Road restriction statistics"
  ,"stats.documentTitle": "Road restriction statistics - Greater Montreal"
  ,"stats.documentTitle.general": "Road restriction statistics - Greater Montreal"
  ,"stats.documentTitle.roads": "Highways and numbered routes | Road restriction statistics - Greater Montreal"
  ,"stats.documentTitle.private": "Public & Private | Road restriction statistics - Greater Montreal"
  ,"stats.documentTitle.territory": "By municipality | Road restriction statistics - Greater Montreal"
  ,"stats.documentTitle.places": "Rankings | Road restriction statistics - Greater Montreal"
  ,"stats.documentTitle.custom": "Custom | Road restriction statistics - Greater Montreal"
  ,"stats.documentTitle.how": "How it works | Road restriction statistics - Greater Montreal"
  ,"stats.disclaimer": "Data received at page load, across all sources and the whole region, regardless of the map view. No history or comparisons over time: completed work is no longer published. Planned durations; possible duplicates across sources."
  ,"stats.loading": "Sources are still loading… figures update as data arrives."
  ,"stats.error": "Some primary sources are unavailable: figures are partial."
  ,"stats.loadedAt": "All sources responded — data loaded on {time}."
  ,"stats.periodFrom": "Selected period: from {start}"
  ,"stats.periodDay": "Selected period: {date}"
  ,"stats.periodRange": "Selected period: {start} to {end}"
  ,"stats.empty": "No data for the selected filters."
  ,"stats.notPublished": "Not published"
  ,"stats.undetermined": "Undetermined"
  ,"stats.intermunicipal": "Intermunicipal / bridges and major axes"
  ,"stats.chartValues": "Show the figures"
  ,"stats.scrollHint": "{visible} of {total} rows visible: scroll the table to see more."
  ,"stats.seriesCritical": "Full closures"
  ,"stats.seriesOther": "Other restrictions"
  ,"stats.colMunicipality": "Municipality"
  ,"stats.noMatch": "No row matches the filters."
  ,"stats.filterSearch": "Search…"
  ,"stats.filterSearchLabel": "Search in “{title}”"
  ,"stats.filterImpact": "Impact types"
  ,"stats.filtersLabel": "Filters for “{title}”"
  ,"stats.filterCount": "{shown} of {total}"
  ,"stats.sortAscending": "Sort “{column}” in ascending order"
  ,"stats.sortDescending": "Sort “{column}” in descending order"
  ,"stats.sortReset": "Remove sorting from “{column}”"
  ,"stats.filterAccount": "On behalf of"
  ,"stats.filterAllAccounts": "All clients"
  ,"stats.filterRouteKind": "Road type"
  ,"stats.filterAllRoutes": "Highways and routes"
  ,"stats.filterAxis": "Axis type"
  ,"stats.filterAllAxes": "All axes"
  ,"stats.filterMunicipality": "Municipality"
  ,"stats.filterAllMunicipalities": "All municipalities"
  ,"stats.filterSource": "Source"
  ,"stats.filterAllSources": "All sources"
  ,"stats.filterSourceType": "Source type"
  ,"stats.filterAllSourceTypes": "All types"
  ,"stats.axis.autoroute": "Highways"
  ,"stats.axis.route": "Numbered routes"
  ,"stats.axis.bridge": "Bridges"
  ,"stats.axis.tunnel": "Tunnels"
  ,"stats.axis.other": "Other"
  ,"stats.colAxis": "Axis"
  ,"stats.colLocation": "Location"
  ,"stats.colResponsible": "Responsible party"
  ,"stats.locationUnpublished": "Exact section not published by the City"
  ,"stats.locationNear": "Near {place}"
  ,"stats.locationBetween": "Between {from} and {to}"
  ,"stats.duplicates": "{n} identical restrictions grouped"
  ,"stats.upperNote": "Identical restrictions are grouped. For highways, the City of Montreal publishes only the highway number, with no exit or landmark: the borough and the responsible party are then the only details available."
  ,"stats.longestNote": "Restrictions kept by the panel filters, from the longest planned duration to the shortest."
  ,"stats.colBorough": "Borough"
  ,"stats.colDuration": "Planned duration"
  ,"stats.kpiTotal": "restrictions in the period"
  ,"stats.kpiCritical": "full closures"
  ,"stats.kpiUpper": "on highways, bridges or tunnels"
  ,"stats.kpiStarting": "start in the next 7 days"
  ,"stats.kpiKm": "of affected roads (measured + estimated)"
  ,"stats.impactTitle": "Breakdown by impact type"
  ,"stats.authorityTitle": "Responsible parties: public or private"
  ,"stats.info.authority": "Who is responsible for the restriction, as published by each source.<br><strong>City / municipality</strong>: work done by the municipality itself.<br><strong>Contractor hired by the City</strong>: private company hired by the City for municipal work.<br><strong>Private company</strong>: private work on its own behalf (e.g. building construction).<br><strong>Utilities</strong>: Hydro-Québec, Bell, Énergir, Vidéotron, CSEM, telecoms.<br><strong>Public body</strong>: MTMD, STM, PJCCI, etc.<br>Details are published by Montreal, Laval and Longueuil; for other sources, the type is inferred from the publishing organization.<br><strong>Selector</strong>: “All” shows the three groups in the centre and their types around them. Choosing a group shows its types in the centre and their detail on the outer ring: network (Hydro-Québec, Bell, Énergir…), company, municipality, body or source. Percentages are then within that group. Beyond 6 details per type, the rest is grouped (e.g. “44 other companies”: 44 more companies, with their total restrictions shown beside)."
  ,"stats.info.critical": "Number of “Full closure” restrictions (red): the street or road is closed to car traffic on the indicated segment."
  ,"stats.info.major": "Number of “Lane affected” restrictions (orange): at least one lane is closed, but the road stays open."
  ,"stats.info.other": "“Limited access” (yellow) and “Parking” (pink) restrictions, when that type is checked in the panel."
  ,"stats.info.impact": "Breakdown of the restrictions kept by the panel filters by impact on car traffic, with the same colours as the map. Only the types checked in the “Impact types” panel are counted."
  ,"stats.info.company": "The mandate type comes from the source, not from us. Montreal publishes the applicant type of each permit, and Longueuil a responsible-party code. The English labels are ours.<br><strong>On its own behalf</strong>: private company doing work for itself (Montreal “company”, Longueuil “contractor or developer”).<br><strong>Hired by the City</strong>: private contractor hired by the City of Montreal for municipal work (“contractorCity”).<br><strong>Utility</strong>: Hydro-Québec, Bell, Énergir, Vidéotron, CSEM and other networks (“contractorRTU”, “csem”).<br>Company names are as published; when missing, the restriction is counted without a name."
  ,"stats.mandateTitle": "Share of work by mandate type"
  ,"stats.colMandate": "Mandate type"
  ,"stats.routeDirectionTitle": "Highways and numbered routes by direction"
  ,"stats.colDirection": "Direction"
  ,"stats.filterDirection": "Direction"
  ,"stats.filterAllDirections": "All directions"
  ,"stats.direction.north": "North"
  ,"stats.direction.south": "South"
  ,"stats.direction.east": "East"
  ,"stats.direction.west": "West"
  ,"stats.direction.both": "Both directions"
  ,"stats.direction.alternating": "One direction at a time"
  ,"stats.direction.other": "Other (see notice)"
  ,"stats.direction.unpublished": "Not published"
  ,"stats.info.direction": "Affected direction as published by the source. “East / West” means both directions are affected. “Other”: the source describes the direction differently (e.g. “toward downtown”). “Not published”: the source gives no direction."
  ,"stats.info.routeDirection": "Same table as “Highways and numbered routes”, split by the affected direction as published by the source. “East / West”: both directions are affected. “Other”: the source describes the direction differently (e.g. “toward downtown”). The MTMD (Québec 511) publishes a direction for every worksite; the City of Montreal publishes none for highways in its feed, so those restrictions are excluded from this table."
  ,"stats.info.upper": "Full closures (red) on a highway, a bridge or a named tunnel, according to the panel filters. Click the source to open the official notice."
  ,"stats.info.axis": "Highway or numbered route (published number or read from the location), otherwise the name of the bridge or tunnel."
  ,"stats.info.municipality": "Number of restrictions per municipality, split by impact type with the map colours: full closure (red), lane affected (orange), limited access (yellow) and parking (pink, when checked in the panel). The chart shows the top 15 municipalities; “Show the figures” lists them all. “Intermunicipal” groups bridges and major axes linking several cities. MTMD restrictions are classified by the municipality named in their location."
  ,"stats.info.days": "Planned duration between the published start and end dates, both days included, in years, months and days."
  ,"stats.info.moderate": "Number of “Limited access” restrictions (yellow): traffic remains possible with restrictions (local access, detour, alternating)."
  ,"stats.info.parking": "Number of “Parking” restrictions (pink): only parking is removed. Counted only when that type is checked in the panel."
  ,"stats.colImpact.critical": "Closures"
  ,"stats.colImpact.major": "Lanes affected"
  ,"stats.colImpact.moderate": "Limited access"
  ,"stats.colImpact.parking": "Parking"
  ,"stats.authorityGroup.public": "Public sector"
  ,"stats.authorityGroup.companies": "Companies"
  ,"stats.authorityGroup.other": "Other / not published"
  ,"stats.colGroup": "Group"
  ,"stats.filterAll": "All"
  ,"stats.filterNone": "None"
  ,"stats.filterSelectedCount": "{n} selected"
  ,"stats.filterCompany": "Company"
  ,"stats.filterResponsible": "Responsible party"
  ,"stats.directionExcluded": "{n} restrictions with no published direction (mostly highways from the City of Montreal feed) are excluded from this table."
  ,"stats.colStreetKm": "Km restricted"
  ,"stats.info.streetKm": "Sum of the lengths of this road's restrictions: measured lines and estimated elongated zones. Two restrictions on the same section (e.g. a lane and parking) are counted twice. “—”: no measurable length (points or compact zones). The road's total length is not shown: it would require loading the full road network of each municipality."
  ,"stats.streetExcluded": "{n} restrictions are not counted because their source does not publish a recognizable street name. Main ones: {list}."
  ,"stats.colReceived": "Restrictions received"
  ,"stats.receivedValue": "{total} restrictions, including {closures} full closures"
  ,"stats.info.received": "Everything this source sent when the page loaded, all dates and impact types together (future restrictions and parking included). The next columns give the estimated length and the split by impact type. This total does not depend on the panel filters."
  ,"stats.unit.yearOne": "{n} year"
  ,"stats.unit.yearOther": "{n} years"
  ,"stats.unit.monthOne": "{n} month"
  ,"stats.unit.monthOther": "{n} months"
  ,"stats.unit.dayOne": "{n} day"
  ,"stats.unit.dayOther": "{n} days"
  ,"stats.info.filtered": "Number of restrictions from this source that match the left panel filters (dates, time of work, impact types). These are the ones used in the statistics."
  ,"stats.info.loaded": "Total number of restrictions received from this source when the page loaded, all dates and impact types together (future restrictions and parking included). Nothing is invented: the gap with the previous column comes only from the filters."
  ,"stats.infoLabel": "More information: {title}"
  ,"stats.tabsLabel": "Statistics sections"
  ,"stats.tab.general": "General"
  ,"stats.tab.roads": "Highways and numbered routes"
  ,"stats.tab.private": "Public & Private"
  ,"stats.tab.custom": "Custom"
  ,"stats.tab.places": "Rankings"
  ,"stats.tab.territory": "By municipality"
  ,"stats.authority.city": "City / municipality (in-house)"
  ,"stats.authority.cityContractor": "Contractor hired by the City"
  ,"stats.authority.private": "Private company"
  ,"stats.authority.utility": "Utilities (Hydro, Bell, Énergir, CSEM…)"
  ,"stats.authority.publicOrg": "Public body (MTMD, STM, PJCCI…)"
  ,"stats.authority.citizen": "Citizen (Montreal permit)"
  ,"stats.authority.event": "Event (UCI)"
  ,"stats.authority.citizenReport": "Citizen report (responsible party unknown)"
  ,"stats.authority.unknown": "Not published"
  ,"stats.companyTitle": "Companies with the most restrictions"
  ,"stats.companyUnnamed": "{n} private or utility restrictions have no published company name."
  ,"stats.forAccount.private": "On its own behalf"
  ,"stats.forAccount.cityContractor": "Hired by the City"
  ,"stats.forAccount.utility": "Utility"
  ,"stats.routeTitle": "Highways and numbered routes"
  ,"stats.routeNote": "Number published by the MTMD, otherwise read from the title or location (A-xx, R-xxx, Décarie expressway, etc.).<br><strong>Total</strong>: every restriction on the route. Then one column per impact type: closures (red), lanes affected (orange), limited access (yellow) and parking (pink, when checked in the panel).<br>Example: the City of Montreal never publishes the affected direction on a highway. Its restrictions are counted here, but not in the table by direction, which keeps only restrictions with a published direction."
  ,"stats.streetTitle": "Streets and roads with the most restrictions"
  ,"stats.streetNote": "Published street name, grouped by municipality. Highways are in the “Highways and numbered routes” tab."
  ,"stats.upperTitle": "Full closures on highways, bridges and tunnels"
  ,"stats.municipalityTitle": "By municipality"
  ,"stats.boroughTitle": "By Montreal borough"
  ,"stats.boroughNote": "Restrictions from the official City of Montreal feed only."
  ,"stats.durationTitle": "Planned durations"
  ,"stats.durationNote": "Computed between the published start and end dates. Events without an end date and citizen reports are excluded."
  ,"stats.durationMedian": "Median planned duration: {n} days ({count} dated restrictions)"
  ,"stats.durationMedianOne": "Median planned duration: 1 day ({count} dated restrictions)"
  ,"stats.durationOne": "{n} day"
  ,"stats.durationRange": "{min} to {max} days"
  ,"stats.durationOver": "More than {n} days"
  ,"stats.longestTitle": "Longest still active"
  ,"stats.lengthTitle": "Length of affected roads"
  ,"stats.lengthNote": "Published lines are measured. Elongated zones (polygons) are ESTIMATED from the length of their minimum bounding rectangle. Compact zones and points have no length. Overlapping lines are each counted."
  ,"stats.lengthMeasured": "Lines (measured)"
  ,"stats.lengthEstimated": "Elongated zones (estimated)"
  ,"stats.lengthNone": "Points and compact zones (no length)"
  ,"stats.upcomingTitle": "Work starting or ending within 7 days"
  ,"stats.upcomingNote": "Independent of the date filter; time-of-day and impact filters apply."
  ,"stats.startingTitle": "New work starting within 7 days"
  ,"stats.endingTitle": "Ongoing work ending within 7 days"
  ,"stats.sourceTitle": "Coverage by source"
  ,"stats.sourceNote": "Every restriction received from each source when the page loaded, all dates together, regardless of the panel filters. Snapshots reflect their extraction date."
  ,"stats.sourceLive": "Live"
  ,"stats.sourceSnapshot": "Snapshot"
  ,"stats.sourceSnapshotDate": "Snapshot of {date}"
  ,"stats.sourceCurated": "Built-in verified list"
  ,"stats.colType": "Type"
  ,"stats.colCount": "Restrictions"
  ,"stats.colShare": "Share"
  ,"stats.colCritical": "Closures"
  ,"stats.colMajor": "Lanes affected"
  ,"stats.colOther": "Other"
  ,"stats.colCompany": "Company"
  ,"stats.colRoute": "Route"
  ,"stats.colStreet": "Street"
  ,"stats.colClosure": "Restriction"
  ,"stats.colStart": "Start"
  ,"stats.colEnd": "End"
  ,"stats.colSource": "Source"
  ,"stats.colPeriod": "Period"
  ,"stats.colDays": "Days"
  ,"stats.colGeometry": "Geometry"
  ,"stats.colLength": "Length"
  ,"stats.colFiltered": "In your filters"
  ,"stats.colLoaded": "Received from the source"
  ,"stats.colRouteDirection": "Route and direction"
  ,"stats.longestLimited": "The {shown} longest of {total} dated restrictions."
  ,"stats.dateMode.label": "Data used by the statistics"
  ,"stats.dateMode.all": "All data"
  ,"stats.dateMode.period": "Active during the chosen period"
  ,"stats.dateSectionTitle": "Data period"
  ,"stats.detail.othersOf.companies": "{n} other companies"
  ,"stats.detail.othersOf.networks": "{n} other networks"
  ,"stats.detail.othersOf.municipalities": "{n} other municipalities"
  ,"stats.detail.othersOf.bodies": "{n} other bodies"
  ,"stats.detail.othersOf.sources": "{n} other sources"
  ,"stats.dateMode.helpLabel": "About the option of restrictions active during the period"
  ,"stats.dateMode.help": "With this option, the statistics only use the restrictions active during the period chosen in the Start and End fields, with the same rule as the map. Restrictions already ended or starting after the period are excluded from every table, chart and calculation.<br>With “All data”, every restriction received is used, whatever its dates."
  ,"stats.scopeAll": "All data received, every date (ended and upcoming restrictions included)"
  ,"stats.kpiTotalAll": "restrictions received"
  ,"stats.longestTitleAll": "Longest"
  ,"stats.info.roadTypes": "<strong>Highway (autoroute)</strong>: divided expressway with controlled access: you enter and leave by ramps, with no intersection or traffic light. Numbers 1 to 99, or 400 and up for secondary highways (e.g. A-15, A-40, A-440).<br><strong>Numbered route</strong>: road of Quebec's main network, with intersections, traffic lights and driveways; it often crosses towns under a street name (e.g. R-117 is boulevard Curé-Labelle in Laval). Numbers 100 to 199 for national routes and 200 to 399 for regional routes."
  ,"stats.filterAuthorityGroup": "Group of responsible parties"
  ,"stats.groupShare": "{n} restrictions · {share} of the total"
  ,"stats.ageTitle": "Age of the work"
  ,"stats.ageOngoing": "Ongoing only"
  ,"stats.colDetail": "Detail"
  ,"stats.tab.how": "How it works"
  ,"stats.how.title": "How the statistics are calculated"
  ,"stats.how.intro": "This page explains where the statistics come from, how they are calculated and why they change. For the sources, their freshness, the colours or the map filters, see the <a href=\"faq.html\">FAQ</a>."
  ,"stats.how.group.data": "The data behind the figures"
  ,"stats.how.group.method": "How each figure is calculated"
  ,"stats.how.group.read": "Reading the statistics correctly"
  ,"stats.how.q.source": "Where do the figures come from?"
  ,"stats.how.a.source": "<p>They are calculated directly in your browser when the page loads, from the same restrictions the map receives. No database or server prepares them in advance, and no extra file is downloaded for the statistics.</p><p>As a result, the statistics show exactly what the sources publish at the time of your visit, with their strengths and their gaps.</p>"
  ,"stats.how.q.history": "Why is there no history or trend?"
  ,"stats.how.a.history": "<p>Most sources are live feeds: they publish current and upcoming restrictions, then remove those that are finished. The site does not keep archives of these feeds.</p><p>So it is impossible to compare with last year or follow a change over time. This is the big difference with the pothole statistics, where the City publishes a complete multi-year history.</p>"
  ,"stats.how.q.changes": "Why do the figures change from one visit to the next?"
  ,"stats.how.a.changes": "<p>Because the data changes: new permits are published, dates are modified and finished work disappears from the feeds. Two visits a few hours apart can give different totals.</p><p>While the page stays open, the statistics are also recalculated every 30 seconds to remove restrictions that have just ended. To get the sources' latest publications, reload the page.</p>"
  ,"stats.how.q.modes": "What is the difference between “Active during the chosen period” and “All data”?"
  ,"stats.how.a.modes": "<p><strong>Active during the chosen period</strong> (default): only restrictions active between the panel's Start and End dates are counted, with the same rule as the map. By default, the period is today.</p><p><strong>All data</strong>: every restriction received is counted, whatever its dates, including upcoming work and snapshots kept for finished events (such as the UCI World Championships). This mode gives a broader picture, but a large finished event can then weigh heavily in the results.</p>"
  ,"stats.how.q.duplicates": "Can the same restriction be counted more than once?"
  ,"stats.how.a.duplicates": "<p>Yes, in some cases:</p><ul><li>The same worksite can be published by more than one source (for example a city and the MTMD).</li><li>A source can split a single permit into several restrictions, one per section or per impact type (a closed lane and removed parking at the same place then count as two).</li></ul><p>Obvious duplicates already handled by the map (for example the closures complementary to the UCI data) are not counted again. Others are, because it is impossible to reliably prove that two publications describe the same worksite.</p>"
  ,"stats.how.q.count": "What counts as “a restriction”?"
  ,"stats.how.a.count": "<p>Each entry published by a source, as it appears on the map: a section, a zone or a point with its dates and impact type. It is therefore not a number of worksites: one large worksite can produce several restrictions.</p><p>The impact type and the time of work (day, night) follow the choices in the left panel.</p>"
  ,"stats.how.q.km": "How are the kilometres estimated?"
  ,"stats.how.a.km": "<ul><li><strong>Published lines:</strong> their length is measured.</li><li><strong>Elongated zones:</strong> the length is estimated from the long side of the smallest rectangle around the zone, when the zone is at least three times longer than it is wide.</li><li><strong>Compact zones and points:</strong> no length is counted.</li></ul><p>Overlapping restrictions are each counted. The kilometres are therefore an order of magnitude of the lanes affected, not an exact measure of the closed network.</p>"
  ,"stats.how.q.duration": "How are durations calculated?"
  ,"stats.how.a.duration": "<p>They are <strong>planned</strong> durations: the gap between the published start and end dates, both days included. The actual duration can be shorter or longer if the worksite changes.</p><p>Restrictions without an end date and citizen reports are excluded. The median duration is the middle one: half of the restrictions last less, the other half more. It resists the few multi-year worksites better than an average.</p>"
  ,"stats.how.q.age": "How is the age of the work calculated?"
  ,"stats.how.a.age": "<p>It is the time elapsed since the published start date: up to today for ongoing work, or up to its end date if it has ended. Work that has not started yet has no age and is not counted.</p>"
  ,"stats.how.q.responsible": "How do we know whether work is public or private?"
  ,"stats.how.a.responsible": "<p>Only from what the sources publish. Montreal gives the type of applicant for each permit, Longueuil a responsibility code and Laval a responsible party. For the other sources, the responsible party is inferred from the publishing body (for example the MTMD).</p><p>Two different questions are separated: <strong>who does</strong> the work (for example a private contractor) and <strong>on whose behalf</strong> (for example the City that hired it). When the source does not allow an answer, the restriction is classed as “Undetermined” rather than guessed.</p>"
  ,"stats.how.q.roads": "How are highways and numbered routes recognized?"
  ,"stats.how.a.roads": "<p>From the number published by the MTMD, otherwise from a number read in the title or location (A-15, R-117, “Décarie expressway”, etc.). Quebec's numbering then separates highways from numbered routes.</p><p>The affected direction is only counted when the source publishes it. The MTMD gives it for every worksite; the City of Montreal does not give it for the highways in its feed.</p>"
  ,"stats.how.q.places": "How are municipalities, boroughs and streets recognized?"
  ,"stats.how.a.places": "<ul><li><strong>Municipality:</strong> the source's own, or the one named in the location for the MTMD. Bridges and major roads linking several cities are grouped under “Intermunicipal”.</li><li><strong>Borough:</strong> only the official City of Montreal feed publishes it.</li><li><strong>Street:</strong> the published name as is, or found in the location sentence. Restrictions whose source publishes no recognizable street name are excluded from the street rankings, and their number is shown.</li></ul>"
  ,"stats.how.q.totals": "Why are totals not always identical from one section to another?"
  ,"stats.how.a.totals": "<ul><li>Some sections only keep what they can classify: a published direction, a street name, a company name, an end date.</li><li>A section's own filters (search, menus, chips) only change that section.</li><li>“Coverage by source” deliberately ignores the panel filters.</li><li>Percentages are rounded and can add up to 99% or 101%.</li></ul>"
  ,"stats.how.q.filters": "Which panel filters apply to the statistics?"
  ,"stats.how.a.filters": "<p>The data period, the time of work and the impact types apply to all the statistics. However, the area shown on the map, the choice of sources and the list search do not apply: the statistics always cover the whole region.</p>"
  ,"stats.how.q.coverage": "What does “Coverage by source” measure?"
  ,"stats.how.a.coverage": "<p>Everything each source sent when the page loaded, whatever the dates and filters. It shows each source's weight in the figures and spots a finished event snapshot (status “Ended”). A very detailed source naturally weighs more than a source that publishes little, without meaning there is more work on its territory.</p>"
  ,"faq.statsHelp": "For questions about road closure statistics, see the dedicated page:"
  ,"faq.statsLink": "Road closure statistics"
  ,"stats.expand": "Enlarge the “{title}” section"
  ,"stats.collapse": "Shrink the “{title}” section"
  ,"stats.cityModeBoroughTitle": "City of Montreal: share by contract per borough"
  ,"stats.colContractShare": "Share by contract"
  ,"stats.info.cityModeBorough": "For each borough, municipal work done by the City's own crews and work given to a contractor, according to the official Montreal feed. The chart shows the 6 boroughs with the most municipal work; “Show the figures” lists them all."
  ,"stats.sectorCompareTitle": "Public or private: comparison"
  ,"stats.colMeasure": "Measure"
  ,"stats.compare.count": "Restrictions"
  ,"stats.compare.critical": "Full closures"
  ,"stats.compare.median": "Median planned duration"
  ,"stats.compare.km": "Average km per restriction"
  ,"stats.compare.days": "{n} d"
  ,"stats.info.sectorCompare": "Compares work done for the public sector and for the private sector (same rule as the “On whose behalf” bar). <strong>Full closures</strong>: share of that sector's restrictions that close the street. <strong>Median planned duration</strong>: between the published start and end dates. <strong>Average km</strong>: average estimated length of restrictions with a measurable length."
  ,"stats.publicOwnerTitle": "Work for the public sector, by body"
  ,"stats.colPublicOwner": "Body or municipality"
  ,"stats.filterPublicOwner": "Body"
  ,"stats.info.publicOwner": "Restrictions for the public sector, even when a private contractor does the work: the municipality (own crews or a mandated contractor), a public body (MTMD, PJCCI, STM…) or a public network (CSEM, Hydro-Québec). Same rule as the “On whose behalf” bar. Colours: impact type, as on the map."
  ,"stats.cityModeTitle": "City of Montreal: own crews or contract"
  ,"stats.cityMode.city": "Own crews"
  ,"stats.cityMode.cityContractor": "Contract (mandated contractor)"
  ,"stats.colMode": "Mode"
  ,"stats.info.cityMode": "Municipal work of the City of Montreal: done by its own crews or given to a private contractor. Only the Montreal feed publishes this for each permit; other municipalities do not."
  ,"stats.publicLongestTitle": "Longest public worksites"
  ,"stats.info.publicLongest": "Worksites done for the public sector, from the longest planned duration to the shortest, with the body or municipality they are for and the estimated length of the restriction."
  ,"stats.territoryPicker": "Territory selection"
  ,"stats.territoryMunicipality": "Municipality"
  ,"stats.territoryBorough": "Borough"
  ,"stats.territoryAllMontreal": "All of Montreal"
  ,"stats.territoryBoroughNote": "Only the official City of Montreal feed gives the borough: other Montreal data (UCI, pedestrian streets) is only counted in “All of Montreal”."
  ,"stats.territoryFew": "Few restrictions published for this territory with the current filters: the statistics below are limited."
  ,"stats.detail.severalNetworks": "Several networks named"
  ,"stats.detail.unnamedNetwork": "Network not specified"
  ,"stats.detail.unnamedCompany": "Company not named"
  ,"stats.detail.others": "Others ({n})"
  ,"stats.age.lessMonth": "Less than a month"
  ,"stats.age.months1to6": "1 to 6 months"
  ,"stats.age.months6to12": "6 to 12 months"
  ,"stats.age.overYear": "Over a year"
  ,"stats.info.age": "Time elapsed since the published start date of each worksite kept by the panel filters: up to today, or up to its end date if it has already ended. Worksites not started yet and citizen reports are not counted.<br><strong>Ongoing only</strong> (checked by default): keeps only the worksites ongoing today in the bar. Uncheck to also include those already ended. This box only affects this bar."
  ,"stats.colStatus": "Status"
  ,"stats.filterStatus": "Status"
  ,"stats.status.active": "Active"
  ,"stats.status.ended": "Ended"
  ,"stats.info.sourceStatus": "<strong>Active</strong>: live source, verified list or municipal snapshot, always considered active.<br><strong>Ended</strong>: snapshot kept for a finished event (e.g. the UCI World Championships), with no restriction ongoing or planned any more. It still counts in the “All data” mode but no longer shows anything on the map. Use the Status filter to remove it from the table."
  ,"stats.info.sourceKm": "Estimated sum of the lengths of every restriction received from this source, all dates together: measured lines and estimated elongated zones. “—”: no measurable length (points or compact zones)."
  ,"stats.info.sectorBy": "Who actually does the work, according to the published responsible party.<br><strong>Public sector</strong>: the city's own crews, or a public body (MTMD, STM, PJCCI, Hydro-Québec).<br><strong>Private sector</strong>: a company, including a contractor hired by the city, or a citizen. In Montreal, utility permits are filed by the contractor doing the work, so they count as private here.<br><strong>Undetermined</strong>: responsible party not published, events (UCI) and citizen reports."
  ,"stats.info.sectorFor": "Whom the work is done for, whoever does it.<br><strong>Public sector</strong>: for the city or a public body, even when a private contractor does the work (contractor mandated by the city, CSEM, Hydro-Québec).<br><strong>Private sector</strong>: for a private company (Bell, Énergir, Vidéotron, developer…) or a citizen.<br><strong>Undetermined</strong>: we do not know whom the work is for. This is the case when the source does not publish the responsible party, for events (UCI) and citizen reports, and for utility work whose owner is not named: the source only says a private contractor does it (e.g. Telecon, Lanauco), not whether it is for Bell, Hydro-Québec or another network."
  ,"stats.info.companyTable": "Companies named by the source: private companies, contractors mandated by the city and utilities. Under the name: the type of mandate.<br><strong>Total</strong>: all their restrictions according to the panel filters, then the estimated length and the split by impact type."
  ,"stats.kpiAutoroutes": "restrictions on highways"
  ,"stats.kpiRoutes": "on numbered routes"
  ,"stats.kpiBridges": "on bridges, tunnels and other major roads"
  ,"stats.kpiUpperCritical": "full closures on highways, bridges or tunnels"
  ,"stats.kpiDirection": "of restrictions on highways and numbered routes have a published direction"
  ,"stats.roadKindTitle": "Split by type of road"
  ,"stats.roadKind.autoroute": "Highways"
  ,"stats.roadKind.route": "Numbered routes"
  ,"stats.roadKind.bridge": "Bridges, tunnels and other major roads"
  ,"stats.roadKind.street": "Local streets and roads"
  ,"stats.info.roadKind": "Every restriction kept by the panel filters, by type of road.<br><strong>Highways</strong> and <strong>numbered routes</strong>: number published or read from the location (A-xx, R-xxx).<br><strong>Bridges, tunnels and other major roads</strong>: a named bridge or tunnel, or an MTMD major road without a number.<br><strong>Local streets and roads</strong>: everything else."
  ,"stats.liveOnly": "<strong>Current data only, no history.</strong> <span class=\"stats-live-detail\">These statistics cover what the sources publish right now, plus the snapshots we keep (e.g. UCI). Completed work the sources no longer publish is not included, unlike the pothole statistics.</span>"
  ,"stats.colTotal": "Total"
  ,"stats.info.total": "All restrictions on this row, every impact type together, according to the panel filters."
  ,"stats.colKm": "Kilometres of restrictions (estimated)"
  ,"stats.info.companyKm": "Estimated sum of the lengths of this company's restrictions: measured lines and estimated elongated zones. Two restrictions on the same section are counted twice. “—”: no measurable length (points or compact zones)."
  ,"stats.routeIntro": "Every restriction received on each highway or numbered route, with or without a published direction."
  ,"stats.upcomingIntro": "These two lists do not show every active restriction. Left: only new work, not started yet, that will start within 7 days. Right: only work already under way that is planned to end within 7 days. A restriction already active that ends more than 7 days from now appears in neither."
  ,"stats.boroughNoModerate": "No “Limited access” restriction: the City of Montreal feed does not publish this type. Its only types are full closure, lane removed (with or without parking) and parking only."
  ,"stats.sectorTitle": "Public or private sector"
  ,"stats.sectorByTitle": "Who does the work"
  ,"stats.sectorForTitle": "On whose behalf"
  ,"stats.sector.public": "Public sector"
  ,"stats.sector.private": "Private sector"
  ,"stats.sector.undetermined": "Undetermined"
  ,"stats.info.sector": "<strong>Who does the work</strong>: public = the city's own crews or a public body (MTMD, STM, PJCCI, Hydro-Québec…); private = a company, including a contractor mandated by the city, or a citizen. In Montreal, utility permits (Bell, Énergir, CSEM…) are filed by the contractor doing the work: they count as private.<br><strong>On whose behalf</strong>: public = work for the city or a public body, even when done by a private contractor (contractor mandated by the city, CSEM, Hydro-Québec); private = work for a private company (Bell, Énergir, Vidéotron, developer…) or a citizen.<br><strong>Undetermined</strong>: the source does not publish who is responsible, events (UCI), citizen reports, or utility work whose owner is not named."
  ,"stats.custom.choices": "Data choices"
  ,"stats.custom.compare": "Compare by"
  ,"stats.custom.split": "Break down by"
  ,"stats.custom.measure": "Measure"
  ,"stats.custom.noSeries": "No breakdown"
  ,"stats.custom.style": "Chart style"
  ,"stats.custom.chartType.bar": "Bars"
  ,"stats.custom.chartType.pie": "Pie"
  ,"stats.custom.chartType.doughnut": "Doughnut"
  ,"stats.custom.chartType.polarArea": "Polar area"
  ,"stats.custom.chartType.radar": "Radar"
  ,"stats.custom.chartType.line": "Comparison line"
  ,"stats.custom.chartType.scatter": "X/Y scatter plot"
  ,"stats.custom.chartType.bubble": "X/Y bubbles"
  ,"stats.custom.xAxis": "X axis"
  ,"stats.custom.yAxis": "Y axis"
  ,"stats.custom.xCategory": "X - Categories"
  ,"stats.custom.yCategory": "Y axis - categories"
  ,"stats.custom.xMeasure": "X axis - measure"
  ,"stats.custom.yMeasure": "Y - Measure"
  ,"stats.custom.leftY": "Y1 axis - bars (left)"
  ,"stats.custom.rightY": "Y2 axis - line (right)"
  ,"stats.custom.categories": "Categories"
  ,"stats.custom.categoryAxes": "Radar axes - categories"
  ,"stats.custom.radialValue": "Radial value - measure"
  ,"stats.custom.valueMeasure": "Value - measure"
  ,"stats.custom.validLeft": "Known values Y1"
  ,"stats.custom.missingLeft": "Missing values Y1"
  ,"stats.custom.validRight": "Known values Y2"
  ,"stats.custom.missingRight": "Missing values Y2"
  ,"stats.custom.mixedSummary": "{count} restrictions selected · missing values: {barMissing} for Y1, {missing} for Y2."
  ,"stats.custom.colorBy": "Color by"
  ,"stats.custom.bubbleSize": "Bubble size"
  ,"stats.custom.axis.length": "Total length (km)"
  ,"stats.custom.axis.duration": "Median planned duration (months)"
  ,"stats.custom.axis.age": "Median age (months)"
  ,"stats.custom.observations": "Restriction groups"
  ,"stats.custom.group": "Group"
  ,"stats.custom.allRecords": "All restrictions"
  ,"stats.custom.knownAxis": "Known values ({axis})"
  ,"stats.custom.knownBubble": "Known values (size)"
  ,"stats.custom.knownValues": "known values"
  ,"stats.custom.pointSummary": "{count} plottable groups of {groups} · {records} restrictions · {missing} groups missing required measures."
  ,"stats.custom.xyNote": "One point per group selected in Color by. Lengths are summed; duration and age use medians. Each measure uses its known values. The table also keeps groups that cannot be plotted."
  ,"stats.custom.bubbleNote": "Bubble area follows the selected measure, with a minimum radius to keep small values visible. Exact values remain in the table."
  ,"stats.custom.includeExtremes": "Include extreme values (X and Y)"
  ,"stats.custom.xyRangeFocused": "95th-percentile bounds: X = {xMaximum}, Y = {yMaximum}. {shown} points within view, {outside} beyond at least one bound. Zooming changes neither group values nor the table."
  ,"stats.custom.xyRangeFull": "Full X and Y scales: {shown} points, including extreme values."
  ,"stats.custom.xyRangeUnchanged": "Full X and Y scales retained: no applicable zoom for these {shown} points."
  ,"stats.custom.fullAxis": "full scale"
  ,"stats.custom.lineNote": "Comparison of selected categories, ranked by restriction count. This line is not a historical trend."
  ,"stats.custom.chartType.mixed": "Mixed: bars and line"
  ,"stats.custom.lineMeasure": "Line measure"
  ,"stats.custom.radarMinimum": "A radar chart needs at least three groups with restrictions."
  ,"stats.custom.mixedNote": "Bars: {bars}, left axis. Line: {line}, right axis. The categories do not represent a trend over time."
  ,"stats.custom.orientation": "Orientation"
  ,"stats.custom.orientation.horizontal": "Horizontal"
  ,"stats.custom.orientation.vertical": "Vertical"
  ,"stats.custom.arrangement": "Arrangement"
  ,"stats.custom.arrangement.grouped": "Grouped"
  ,"stats.custom.arrangement.stacked": "Stacked"
  ,"stats.custom.arrangement.percent": "100%"
  ,"stats.custom.groups": "Groups shown"
  ,"stats.custom.period": "Data period"
  ,"stats.custom.activePeriod": "Active during the selected period"
  ,"stats.custom.allDates": "All available data"
  ,"stats.custom.start": "Start"
  ,"stats.custom.end": "End"
  ,"stats.custom.time": "Time of work"
  ,"stats.custom.time.day": "Day"
  ,"stats.custom.time.night": "Night"
  ,"stats.custom.field.municipality": "Municipality"
  ,"stats.custom.field.borough": "Borough"
  ,"stats.custom.montrealOnly": "Montreal only: borough comparisons use Montreal data only. Other municipalities are excluded from this chart."
  ,"stats.custom.field.impact": "Impact type"
  ,"stats.custom.field.roadKind": "Road type"
  ,"stats.custom.field.route": "Highway or numbered route"
  ,"stats.custom.field.street": "Street"
  ,"stats.custom.field.authority": "Responsible party type"
  ,"stats.custom.field.organization": "Organization"
  ,"stats.custom.field.performer": "Sector carrying out the work"
  ,"stats.custom.field.beneficiary": "Beneficiary sector"
  ,"stats.custom.field.direction": "Published direction"
  ,"stats.custom.field.source": "Source"
  ,"stats.custom.field.status": "Status based on dates"
  ,"stats.custom.field.timePeriod": "Day / night"
  ,"stats.custom.field.lengthMethod": "Measurement method"
  ,"stats.custom.metric.count": "Number of restrictions"
  ,"stats.custom.metric.share": "Share of selected restrictions"
  ,"stats.custom.metric.length": "Estimated affected length"
  ,"stats.custom.metric.duration": "Median planned duration"
  ,"stats.custom.metric.age": "Median age"
  ,"stats.custom.style.horizontal": "Grouped horizontal bars"
  ,"stats.custom.style.vertical": "Grouped vertical columns"
  ,"stats.custom.style.stacked-horizontal": "Stacked horizontal bars"
  ,"stats.custom.style.stacked-vertical": "Stacked vertical columns"
  ,"stats.custom.style.percent-horizontal": "100% stacked bars"
  ,"stats.custom.style.percent-vertical": "100% stacked columns"
  ,"stats.custom.style.pie": "Pie"
  ,"stats.custom.style.doughnut": "Doughnut"
  ,"stats.custom.value.ongoing": "Ongoing based on dates"
  ,"stats.custom.value.upcoming": "Upcoming"
  ,"stats.custom.value.ended": "Ended based on dates"
  ,"stats.custom.value.day": "Day"
  ,"stats.custom.value.night": "Night"
  ,"stats.custom.value.both": "Day and night"
  ,"stats.custom.value.line": "Measured line"
  ,"stats.custom.value.estimated": "Estimated elongated zone"
  ,"stats.custom.unknown": "Not provided"
  ,"stats.custom.unknown.directionCode": "Direction not published"
  ,"stats.custom.unknown.organizationKey": "Organization not specified"
  ,"stats.custom.unknown.routeNumber": "No identified route number"
  ,"stats.custom.unknown.boroughKey": "Borough not published"
  ,"stats.custom.unknown.streetKey": "Street not identified"
  ,"stats.custom.unknown.lengthMethod": "Length cannot be measured"
  ,"stats.custom.search": "Search"
  ,"stats.custom.keepSelection": "Show only the selection"
  ,"stats.custom.noMatches": "No choices match this search."
  ,"stats.custom.noOptions": "No choices are available for the selected data."
  ,"stats.custom.selectAll": "Select all"
  ,"stats.custom.all": "All"
  ,"stats.custom.resizeChoices": "Adjust data choices width"
  ,"stats.custom.selectNone": "Deselect all"
  ,"stats.custom.reset": "Reset choices"
  ,"stats.custom.summary": "{count} restrictions selected · {missing} missing values for this measure."
  ,"stats.custom.loading": "Sources are still loading."
  ,"stats.custom.coverage": "{shown} groups shown out of {total}, ranked by restriction count."
  ,"stats.custom.otherGroups": "Other groups"
  ,"stats.custom.otherSeries": "Other series"
  ,"stats.custom.seriesCollapsed": "The seven most frequent series are shown separately; the others are combined and their values recalculated. The table retains every series."
  ,"stats.custom.otherIncluded": "The remaining groups are combined into a separate slice."
  ,"stats.custom.values": "View data"
  ,"stats.custom.value": "Value"
  ,"stats.custom.records": "Restrictions"
  ,"stats.custom.valid": "Known values"
  ,"stats.custom.missing": "Missing values"
  ,"stats.custom.denominator": "Percentage base"
  ,"stats.custom.days": "days"
  ,"stats.custom.months": "months"
  ,"stats.custom.help.title": "Understanding custom statistics"
  ,"stats.custom.help.about": "About {label}"
  ,"stats.custom.help.close": "Close explanations"
  ,"stats.custom.help.choice": "Choice"
  ,"stats.custom.help.type": "Data type"
  ,"stats.custom.help.definition": "Definition and interpretation"
  ,"stats.custom.help.axis.category": "Chooses the groups to compare: municipality, impact, source, and so on. Each group contains restrictions sharing that value. X names this first choice; horizontal bars then rotate the drawing."
  ,"stats.custom.help.axis.measure": "Chooses the number calculated for each group: count, percentage, sum or median. In Mixed mode, Y1 is the bars and Y2 the line; each has its own unit. The table below lists only measures compatible with the selected chart."
  ,"stats.custom.help.axis.series": "Divides each group into comparable subgroups shown as separate colors or series. For example, Municipality on X and Impact type under Split by compare impacts within each city."
  ,"stats.custom.help.axis.x": "Chooses the measure calculated for each group and its horizontal position. Color by defines groups: Municipality gives one point per city. Lengths are summed; duration and age use the median of their known values. X and Y are limited to their 95th percentile; Include extreme values restores both full scales. With fewer than 20 points or an unusable bound, that axis stays complete. Unplottable groups remain in the table."
  ,"stats.custom.help.axis.y": "Chooses the second measure calculated for each group and its vertical position. It must differ from X. Like X, Y uses the group's known values and can be limited to its 95th percentile. The same Include extreme values checkbox controls both axes. A relationship between groups proves neither a relationship between individual restrictions nor causation."
  ,"stats.custom.help.axis.bubble": "Chooses a measure calculated for each group to determine its bubble size: summed length or median duration or age. Area varies with the value, with a minimum radius for small values. The table also shows how many known values entered the calculation."
  ,"stats.custom.help.axis.color": "Defines both groups and their colors. Municipality gives one point per city; Source gives one point per source. Axes and bubble sizes are recalculated from each group's restrictions. All restrictions produces one overall point. Impact colors still match the map."
  ,"stats.custom.help.axis.none": "Does not create subgroups: values are represented as one series."
  ,"stats.custom.help.observation.lengthMeters": "Sum of all known or estimated restriction lengths in the group, in kilometres. Overlaps are counted separately. Missing lengths do not contribute to the total and are never turned into zero."
  ,"stats.custom.help.observation.plannedDurationDays": "Median known planned duration in the group, in months. Half are below it and half above it. Adding simultaneous roadworks would not give a representative duration. Estimated, undetermined or open-ended dates are excluded."
  ,"stats.custom.help.observation.ageDays": "Median known age of the group's restrictions, in months, until today or their known end. Upcoming restrictions do not enter this calculation. Known-value counts are shown in the table."
  ,"stats.custom.help.intro": "This page builds comparisons from the restrictions received by the site. A restriction is a published entry; one construction project may produce several entries. This is neither a ranking of municipal performance nor a complete history of roadworks."
  ,"stats.custom.help.stepsTitle": "Build a comparison"
  ,"stats.custom.help.step1": "Choose a chart type: bars, line, pie, doughnut, polar area, radar or mixed. Available choices depend on the selected measure."
  ,"stats.custom.help.step2": "First choose X, the category to compare, then Y, the measure. Horizontal orientation rotates the drawing without changing the meaning of your choices. Mixed charts have separate Y1 and Y2 measures."
  ,"stats.custom.help.step3": "Set the period, impacts and values to keep. All checked includes every value; an empty selection includes none. Searching alone does not change the selection."
  ,"stats.custom.help.step4": "Read the axes, legend and View data table. Missing-value counts and percentage bases show what was actually calculated."
  ,"stats.custom.help.fieldsTitle": "Available categories"
  ,"stats.custom.help.measuresTitle": "Measures and units"
  ,"stats.custom.help.controlsTitle": "Understanding the controls"
  ,"stats.custom.help.unit.count": "Whole number"
  ,"stats.custom.help.unit.percent": "Percentage"
  ,"stats.custom.help.unit.meters": "Decimal number, kilometres"
  ,"stats.custom.help.unit.days": "Number, months"
  ,"stats.custom.help.metric.count": "Number of selected restrictions. This is not necessarily a count of unique construction projects."
  ,"stats.custom.help.metric.share": "A group's share of all restrictions remaining after filtering. The table lists the denominator."
  ,"stats.custom.help.metric.length": "Sum of measurable or estimated lengths. Overlapping restrictions are counted separately. A point or compact zone does not provide a known length."
  ,"stats.custom.help.metric.duration": "Median planned duration between the retained dates. Half the durations are below it and half above it. This is not actual working time."
  ,"stats.custom.help.metric.age": "Median time since the published start, until today or the known end. Upcoming restrictions do not enter this median."
  ,"stats.custom.help.months": "Durations are displayed in months with at most one decimal place and no unnecessary trailing zero. An average month is 365.25 / 12 days. A positive duration below 0.1 months is shown as <0.1, never as a false zero. Source dates and calculations are unchanged."
  ,"stats.custom.help.dates": "Planned duration requires valid start and end dates treated as published. Age requires a published start that has already occurred. Estimated dates or dates of unknown provenance do not enter these medians; an open end such as 2099 is not converted into several decades of duration."
  ,"stats.custom.help.field.municipality": "City associated with the restriction. Bridges and routes linking cities can belong to the intermunicipal group."
  ,"stats.custom.help.field.borough": "Borough published by Montreal. Choosing this category automatically limits the chart to Montreal data."
  ,"stats.custom.help.field.impact": "Effect on traffic: full closure, affected lane, limited access or parking. Colors match the map."
  ,"stats.custom.help.field.roadKind": "Highway, numbered route, bridge/tunnel/major road or local road, based on available information."
  ,"stats.custom.help.field.route": "Identified highway or route number, such as A-40. A local street without a number is not a missing numbered route."
  ,"stats.custom.help.field.street": "Street name recognized in the data. Missing or ambiguous names are not invented."
  ,"stats.custom.help.field.authority": "Type of responsible party: city, public body, contractor, company, utility, event or citizen report."
  ,"stats.custom.help.field.organization": "Identifiable company, public body or responsible organization. A generic role is not treated as a company name."
  ,"stats.custom.help.field.performer": "Public or private sector of the party carrying out the work, when determinable."
  ,"stats.custom.help.field.beneficiary": "Sector on whose behalf the work is done. A private contractor can work for a public municipality."
  ,"stats.custom.help.field.direction": "Traffic direction actually published. A line between two intersections does not establish a traffic direction."
  ,"stats.custom.help.field.source": "Data provider: municipality, MTMD, snapshot or complementary source. Coverage differs between providers."
  ,"stats.custom.help.field.status": "State calculated from dates: ongoing, upcoming, ended or undetermined. This is not field verification."
  ,"stats.custom.help.field.timePeriod": "Day, night or both according to available information. Some sources do not publish precise schedules and use a default classification."
  ,"stats.custom.help.field.lengthMethod": "How length was obtained: measured line or estimated elongated zone. Points and compact zones remain unmeasurable."
  ,"stats.custom.help.control.axes": "X, Y, Y1 and Y2"
  ,"stats.custom.help.controlDefinition.axes": "X is the first category choice in grouped charts, Y the measure. Horizontal bars swap their visual positions. Mixed Y1 and Y2 each have their own unit and axis."
  ,"stats.custom.help.control.filters": "Filters, search and All"
  ,"stats.custom.help.controlDefinition.filters": "Checkboxes select included values. All has three states: complete, empty and partial. Show only the selection keeps checked visible results from a search that started with everything selected."
  ,"stats.custom.help.control.period": "Data period"
  ,"stats.custom.help.controlDefinition.period": "Active during the selected period keeps restrictions overlapping those dates. All available data includes retained entries outside that period too; it is not a complete history."
  ,"stats.custom.help.control.xy": "Scatter and Bubbles"
  ,"stats.custom.help.controlDefinition.xy": "Each point represents a group defined by Color by. X, Y and bubble size use summed length or median duration or age. Known values are used separately for each measure and counts are shown. A group lacking required measures remains in the table without being plotted. Visual association does not establish causation."
  ,"stats.custom.help.missingTitle": "Why are some values missing?"
  ,"stats.custom.help.missing": "The label depends on the field: unpublished direction, unidentified street and unmeasurable length are different situations. The missing-value counter concerns the selected measure, not unknown categories. Unknown groups remain visible rather than hiding restrictions. An unknown value is never a zero."
  ,"stats.custom.help.comparison": "Other tabs sometimes use narrower populations: the company table keeps named companies, boroughs use only the Montreal feed, and routes by direction keep only published directions. Their small missing-value counts do not describe all received restrictions."
  ,"stats.custom.help.organizationFix": "Organization includes named public bodies and events as well as identified companies. Truly unpublished traffic directions remain unknown: they are not inferred from a source color or the direction of a line."
  ,"stats.custom.help.styleIntro": "Chart type changes the representation, not the meaning of the data. Choices incompatible with a measure are hidden."
  ,"stats.custom.help.style.bar": "Compares category values. Horizontal bars suit long names; vertical orientation gives columns. Series can be grouped or stacked when their values are additive."
  ,"stats.custom.help.style.line": "Connects category values ranked by restriction count. It compares categories rather than showing a history over time."
  ,"stats.custom.help.style.pie": "Shows each category's part of a distribution. One grouping dimension, with no median or second series."
  ,"stats.custom.help.style.doughnut": "Read like a pie chart, with an empty centre. Slices represent parts of a total."
  ,"stats.custom.help.style.polarArea": "Compares values in equal-angle circular sectors. Sector size varies with the value; it is not a pie chart."
  ,"stats.custom.help.style.radar": "Places categories around a circle and plots their values radially. At least three categories, using the same measure in every direction."
  ,"stats.custom.help.style.mixed": "Combines bars on the left axis and a line on the right axis. Measures are selected independently; comparing their heights without reading both scales is misleading."
  ,"stats.custom.help.style.scatter": "Positions one point per group using two X/Y measures: summed length or median duration or age. Color by determines the grouping."
  ,"stats.custom.help.style.bubble": "A grouped scatter plot where size represents a third group measure. A minimum radius keeps small values visible; values and counts are in the table."
  ,"stats.custom.help.orientationIntro": "Orientation applies to bars. X - Categories remains the first data choice; orientation only changes where the elements are drawn."
  ,"stats.custom.help.orientation.horizontal": "Categories run down the left; values are read horizontally. Useful for long names."
  ,"stats.custom.help.orientation.vertical": "Categories run along the bottom and values rise vertically. Useful for comparing columns."
  ,"stats.custom.help.arrangementIntro": "Arrangement organizes multiple series of the same measure. Medians cannot be added and therefore cannot be stacked."
  ,"stats.custom.help.arrangement.grouped": "Series are placed side by side for direct comparison."
  ,"stats.custom.help.arrangement.stacked": "Series add up within each bar; total height or length is the group's known sum."
  ,"stats.custom.help.arrangement.percent": "Each group with a positive sum is scaled to 100%. Colors show composition rather than absolute volume."
  ,"stats.custom.help.groups": "Limits the number of drawn categories, ranked by restriction count. For example, 10 shows the ten most represented municipalities. The table keeps every category. Circular charts combine the rest into Other groups; this is not a number of measures."
  ,"stats.custom.legend": "Legend"
  ,"stats.custom.sort": "Change sort direction"
  ,"stats.custom.sortOriginal": "Restore the original order of {column}"
  ,"stats.custom.constantStatus": "Status based on dates: {status} throughout this selection."
  ,"stats.custom.previous": "Previous page"
  ,"stats.custom.next": "Next page"
  ,"stats.custom.page": "Page {page} of {total}"
  ,"stats.custom.groupDenominator": "Each group with a positive sum totals 100% of its known values. The percentage base is listed in the table; for lengths, it is expressed in metres."
  ,"stats.custom.selectionDenominator": "Percentages use all restrictions remaining after filtering, including groups not displayed in the chart."
  ,"stats.custom.note.length": "Sum of measured lines and estimated elongated zones. Overlaps are counted; points and compact zones have no known length."
  ,"stats.custom.note.duration": "Planned durations between retained dates, not actual time worked. Estimated dates, dates of undetermined origin and citizen reports are excluded from this measure."
  ,"stats.custom.note.age": "Time since the published start, until today or the known end. Future, estimated or undetermined starts and citizen reports are excluded from this measure."
  ,"stats.custom.noValues": "No usable values for this chart. Record counts remain available in the table."
  ,"stats.custom.chartError": "The chart is unavailable. The figures remain accessible below."
  ,"stats.custom.loadError": "The custom view could not be loaded."
  ,"stats.custom.retry": "Retry"
};
